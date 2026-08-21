import { Helmet } from 'react-helmet-async';

import { SITE_URL } from '../../utils/constants';
import { toAbsoluteImageUrl } from '../../utils/image-url';

interface PageMetaProps {
  title: string;
  description?: string;
  /** Тип страницы для Open Graph. Заметки — 'article', остальное — 'website'. */
  type?: 'website' | 'article';
  /** Дата публикации в ISO-формате (для article:published_time). */
  publishedTime?: string;
  /** Рубрика/тип заметки (для article:section). */
  section?: string;
  /** Закрыть страницу от индексации (приватные/служебные разделы). */
  noindex?: boolean;
  /**
   * Явный канонический URL. Если не задан — вычисляется из текущего адреса.
   * Для заметок передаём канонический /n/:slug, чтобы он не зависел от того,
   * по какому маршруту (/note/:id или /n/:slug) открыта страница.
   */
  url?: string;
  /** Абсолютный URL картинки для og:image / twitter:image. */
  image?: string;
}

const SITE_NAME = 'NTLSTL';
const DEFAULT_DESCRIPTION = 'NTLSTL — платформа для ведения заметок';

/**
 * Канонический URL текущей страницы без query-параметров и хэша.
 * Домен всегда берём из фиксированного SITE_URL (а не window.location.origin),
 * чтобы canonical/og:url не зависели от хоста, по которому открыта страница.
 */
function getCanonicalUrl(): string {
  if (typeof window === 'undefined') return SITE_URL;
  return `${SITE_URL}${window.location.pathname}`;
}

export default function PageMeta({
  title,
  description,
  type = 'website',
  publishedTime,
  section,
  noindex = false,
  url,
  image,
}: PageMetaProps) {
  const fullTitle = `${title} — ${SITE_NAME}`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonical = url || getCanonicalUrl();
  // og:image/twitter:image требуют абсолютный URL на каноническом домене.
  const absoluteImage = toAbsoluteImageUrl(image);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta
        name="description"
        content={metaDescription}
      />
      <link
        rel="canonical"
        href={canonical}
      />
      {noindex && (
        <meta
          name="robots"
          content="noindex, nofollow"
        />
      )}

      {/* Open Graph */}
      <meta
        property="og:site_name"
        content={SITE_NAME}
      />
      <meta
        property="og:type"
        content={type}
      />
      <meta
        property="og:title"
        content={fullTitle}
      />
      <meta
        property="og:description"
        content={metaDescription}
      />
      <meta
        property="og:url"
        content={canonical}
      />
      <meta
        property="og:locale"
        content="ru_RU"
      />
      {absoluteImage && (
        <meta
          property="og:image"
          content={absoluteImage}
        />
      )}
      {type === 'article' && publishedTime && (
        <meta
          property="article:published_time"
          content={publishedTime}
        />
      )}
      {type === 'article' && section && (
        <meta
          property="article:section"
          content={section}
        />
      )}

      {/* Twitter Card */}
      <meta
        name="twitter:card"
        content={absoluteImage ? 'summary_large_image' : 'summary'}
      />
      <meta
        name="twitter:title"
        content={fullTitle}
      />
      <meta
        name="twitter:description"
        content={metaDescription}
      />
      {absoluteImage && (
        <meta
          name="twitter:image"
          content={absoluteImage}
        />
      )}
    </Helmet>
  );
}
