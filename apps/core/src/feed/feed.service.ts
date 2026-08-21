import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Note } from '../notes/entities/note.entity';
import { Type } from '../types/entities/type.entity';

const DEFAULT_SITE_URL = 'https://notes.ntlstl.dev';
const RSS_LIMIT = 30;

/**
 * Экранирование спецсимволов XML для безопасной вставки текста в фид/карту сайта.
 */
function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return char;
    }
  });
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private readonly siteUrl: string;

  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
    private readonly configService: ConfigService,
  ) {
    this.siteUrl = (
      this.configService.get<string>('SITE_URL') ?? DEFAULT_SITE_URL
    ).replace(/\/+$/, '');
  }

  /** Канонический адрес заметки — /n/:slug (совпадает с canonical на клиенте). */
  private noteUrl(slug: string): string {
    return `${this.siteUrl}/n/${slug}`;
  }

  async generateRss(): Promise<string> {
    this.logger.log('Generating RSS feed');

    const notes = await this.noteRepository.find({
      relations: { type: true },
      where: { published: true },
      order: { id: 'DESC' },
      take: RSS_LIMIT,
      select: {
        id: true,
        slug: true,
        title: true,
        preview: true,
        createdAt: true,
        type: { id: true, name: true },
      },
    });

    const lastBuildDate = new Date().toUTCString();

    const items = notes
      .map((note) => {
        const link = this.noteUrl(note.slug);
        const category = note.type?.name
          ? `\n      <category>${escapeXml(note.type.name)}</category>`
          : '';
        return `    <item>
      <title>${escapeXml(note.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(note.preview ?? '')}</description>
      <pubDate>${new Date(note.createdAt).toUTCString()}</pubDate>${category}
    </item>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NTLSTL — заметки</title>
    <link>${this.siteUrl}</link>
    <atom:link href="${this.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Платформа для ведения заметок NTLSTL</description>
    <language>ru</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;
  }

  async generateSitemap(): Promise<string> {
    this.logger.log('Generating sitemap');

    const [notes, types] = await Promise.all([
      this.noteRepository.find({
        where: { published: true },
        order: { id: 'DESC' },
        select: { id: true, slug: true, updatedAt: true },
      }),
      this.typeRepository.find({ select: { id: true } }),
    ]);

    const urls: string[] = [];

    urls.push(`  <url>
    <loc>${this.siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

    for (const type of types) {
      urls.push(`  <url>
    <loc>${this.siteUrl}/notes/type/${type.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    for (const note of notes) {
      urls.push(`  <url>
    <loc>${this.noteUrl(note.slug)}</loc>
    <lastmod>${new Date(note.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  }
}
