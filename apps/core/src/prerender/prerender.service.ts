import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotesService } from '../notes/notes.service';

const DEFAULT_SITE_URL = 'https://notes.ntlstl.dev';
const SITE_NAME = 'NTLSTL';
const DEFAULT_DESCRIPTION = 'NTLSTL — платформа для ведения заметок';

interface MetaInput {
  title: string;
  description: string;
  canonical: string;
  type: 'website' | 'article';
  publishedTime?: string;
  section?: string;
  jsonLd?: Record<string, unknown>;
  /** Текст, показываемый в <body> (краткое содержимое для скрейперов/людей). */
  body?: string;
  /** Абсолютный URL обложки для og:image / twitter:image. */
  image?: string;
}

/** Экранирование для безопасной вставки текста в HTML-разметку. */
function escapeHtml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

/**
 * Серверный пререндер OG-разметки для соц-скрейперов (Telegram/VK/WhatsApp/
 * Facebook/Slack/Discord и т.п.), которые не исполняют JS и потому не видят
 * теги, проставляемые react-helmet-async на клиенте. nginx направляет сюда
 * только запросы с ботовым User-Agent (см. client/nginx). Обычные пользователи
 * и поисковики (рендерят JS) получают обычный SPA с Helmet.
 */
@Injectable()
export class PrerenderService {
  private readonly logger = new Logger(PrerenderService.name);
  private readonly siteUrl: string;

  constructor(
    private readonly notesService: NotesService,
    private readonly configService: ConfigService,
  ) {
    this.siteUrl = (
      this.configService.get<string>('SITE_URL') ?? DEFAULT_SITE_URL
    ).replace(/\/+$/, '');
  }

  /**
   * Приводит хранимый URL картинки к абсолютному на канонический домен для
   * og:image / JSON-LD (соц-скрейперам нужен абсолютный адрес). Обложки теперь
   * хранятся относительным путём (`/api/v1/uploads/...`), но метод также
   * «чинит» легаси-значения с прошитым неверным хостом (напр. http://localhost)
   * — вырезает часть с /api/v1/uploads/ и достраивает её от SITE_URL. Внешние
   * абсолютные картинки возвращаются как есть.
   */
  private toAbsoluteImageUrl(image?: string | null): string | undefined {
    if (!image) return undefined;
    const marker = '/api/v1/uploads/';
    const idx = image.indexOf(marker);
    if (idx !== -1) return `${this.siteUrl}${image.slice(idx)}`;
    if (image.startsWith('/')) return `${this.siteUrl}${image}`;
    return image;
  }

  /** Мета главной / произвольной страницы (когда конкретной заметки нет). */
  home(path = '/'): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return this.buildHtml({
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      canonical: `${this.siteUrl}${normalized === '/' ? '/' : normalized}`,
      type: 'website',
      body: DEFAULT_DESCRIPTION,
    });
  }

  /** Мета конкретной заметки по slug. При отсутствии — отдаём мета главной. */
  async noteBySlug(slug: string): Promise<string> {
    try {
      const note = await this.notesService.findBySlug(slug);
      return this.note(note as never);
    } catch {
      this.logger.warn('Prerender: note not found by slug', { slug });
      return this.home(`/n/${slug}`);
    }
  }

  /** Мета конкретной заметки по id. Canonical всё равно указывает на /n/:slug. */
  async noteById(id: number): Promise<string> {
    try {
      const note = await this.notesService.findOne(id);
      return this.note(note as never);
    } catch {
      this.logger.warn('Prerender: note not found by id', { id });
      return this.home(`/note/${id}`);
    }
  }

  private note(note: {
    slug: string;
    title: string;
    preview?: string;
    coverImage?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    type?: { name?: string };
  }): string {
    const canonical = `${this.siteUrl}/n/${note.slug}`;
    const description = note.preview?.trim() || DEFAULT_DESCRIPTION;
    const image = this.toAbsoluteImageUrl(note.coverImage);
    const publishedTime = note.createdAt
      ? new Date(note.createdAt).toISOString()
      : undefined;

    return this.buildHtml({
      title: note.title,
      description,
      canonical,
      type: 'article',
      publishedTime,
      section: note.type?.name,
      body: description,
      image,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: note.title,
        description,
        image,
        datePublished: publishedTime,
        dateModified: note.updatedAt
          ? new Date(note.updatedAt).toISOString()
          : undefined,
        articleSection: note.type?.name,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      },
    });
  }

  private buildHtml({
    title,
    description,
    canonical,
    type,
    publishedTime,
    section,
    jsonLd,
    body,
    image,
  }: MetaInput): string {
    const fullTitle = `${title} — ${SITE_NAME}`;
    const t = escapeHtml(fullTitle);
    const d = escapeHtml(description);
    const url = escapeHtml(canonical);
    const img = image ? escapeHtml(image) : undefined;

    const articleTags = [
      type === 'article' && publishedTime
        ? `    <meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`
        : '',
      type === 'article' && section
        ? `    <meta property="article:section" content="${escapeHtml(section)}" />`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const jsonLdTag = jsonLd
      ? `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
      : '';

    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow" />
    <link rel="alternate" type="application/rss+xml" title="NTLSTL — заметки" href="/rss.xml" />

    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="ru_RU" />
${img ? `    <meta property="og:image" content="${img}" />\n` : ''}${articleTags}

    <meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
${img ? `    <meta name="twitter:image" content="${img}" />\n` : ''}${jsonLdTag}
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(body ?? description)}</p>
      <p><a href="${url}">${url}</a></p>
    </main>
  </body>
</html>`;
  }
}
