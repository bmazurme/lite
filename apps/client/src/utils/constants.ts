export const { VITE_TOKEN } = import.meta.env;
export const BASE_PROJECT_API_URL = import.meta.env.VITE_API_DOMAIN || 'http://localhost:3000/api/v1';

/**
 * Канонический адрес сайта. Используется для canonical/og:url, чтобы они не
 * зависели от того, по какому хосту открыта страница (www, IP, http вместо https,
 * превью-домен). Должен совпадать с backend-переменной SITE_URL (RSS/sitemap/пререндер).
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://notes.ntlstl.dev').replace(/\/+$/, '');
