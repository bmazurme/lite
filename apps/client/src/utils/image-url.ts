import { SITE_URL } from './constants';

const UPLOADS_MARKER = '/api/v1/uploads/';

/**
 * Путь загруженной картинки относительно текущего origin — для тегов <img>
 * на самом сайте. Обложки/картинки хранятся относительным путём, но у легаси-
 * значений может быть прошит неверный абсолютный хост (напр. http://localhost);
 * вырезаем часть с /api/v1/uploads/, чтобы браузер разрешил её от текущего
 * origin. Внешние абсолютные картинки возвращаем как есть.
 */
export function toRelativeImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined;
  const idx = image.indexOf(UPLOADS_MARKER);
  if (idx !== -1) return image.slice(idx);
  return image;
}

/**
 * Абсолютный URL картинки на каноническом домене (SITE_URL) — для og:image /
 * twitter:image / JSON-LD, которым нужен абсолютный адрес. Относительные пути
 * и легаси-значения с /api/v1/uploads/ достраиваются от SITE_URL; внешние
 * абсолютные URL остаются нетронутыми.
 */
export function toAbsoluteImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined;
  const idx = image.indexOf(UPLOADS_MARKER);
  if (idx !== -1) return `${SITE_URL}${image.slice(idx)}`;
  if (image.startsWith('/')) return `${SITE_URL}${image}`;
  return image;
}
