/* eslint-disable @typescript-eslint/no-explicit-any */
import { YfmStaticView } from '@gravity-ui/markdown-editor';
import debounce from 'lodash/debounce';
import { parse, setOptions } from 'marked';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../hooks/use-theme';

import style from './markdown-preview.module.css';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Преобразует Obsidian-подобные вики-ссылки `[[Заголовок]]` и
 * `[[Заголовок|Текст]]` в кликабельные ссылки на резолвер `/wiki/:title`.
 */
const renderWikiLinks = (markdown: string) =>
  markdown.replace(
    /\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const title = target.trim();
      const text = escapeHtml((alias ?? target).trim());
      const href = `/wiki/${encodeURIComponent(title)}`;
      return `<a class="wikilink" data-internal="true" href="${href}">${text}</a>`;
    },
  );

function transform(
  markdown: string,
  options: {
    allowHTML?: boolean;
    breaks?: boolean;
    plugins?: any[];
    linkify?: boolean;
    linkifyTlds?: string[];
    needToSanitizeHtml?: boolean;
  }
) {
  setOptions({
    gfm: true,
    breaks: options.breaks ?? true,
  });

  const html = parse(renderWikiLinks(markdown));

  return {
    result: {
      html,
      meta: {},
    },
  };
}

interface MarkdownPreviewProps {
  getValue: () => string;
  allowHTML?: boolean;
  breaks?: boolean;
  linkify?: boolean;
  linkifyTlds?: string[];
  needToSanitizeHtml?: boolean;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = (props) => {
  const {
    getValue,
    allowHTML,
    breaks,
    linkify,
    linkifyTlds,
    needToSanitizeHtml,
  } = props;

  const [html, setHtml] = useState('');
  const divRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Перехватываем клики по внутренним вики-ссылкам, чтобы переходить
  // средствами роутера (SPA), а не полной перезагрузкой страницы.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      'a[data-internal="true"]',
    );
    if (!anchor) return;

    event.preventDefault();
    event.stopPropagation();
    const url = new URL(anchor.href);
    navigate(`${url.pathname}${url.search}`);
  };

  const safeSetHtml = (value: string | Promise<string>) => {
    if (value instanceof Promise) {
      value.then(resolvedValue => setHtml(resolvedValue));
    } else {
      setHtml(value);
    }
  };

  const render = useMemo(
    () => debounce(async () => {
      try {
        const res = await transform(getValue(), {
          allowHTML,
          breaks,
          linkify,
          linkifyTlds,
          needToSanitizeHtml,
        }).result;

        safeSetHtml(res.html);
      } catch (error) {
        console.error('Ошибка преобразования Markdown:', error);
        setHtml('<p>Ошибка при преобразовании Markdown</p>');
      }
    }, 200),
    [getValue, allowHTML, breaks, linkify, linkifyTlds, needToSanitizeHtml]
  );

  useEffect(() => {
    render();
  }, [props, render]);

  // Рендерим mermaid-диаграммы: marked отдаёт ```mermaid как
  // <pre><code class="language-mermaid">, заменяем такие блоки на SVG.
  // mermaid подгружаем динамически — тяжёлую библиотеку не тянем в основной бандл.
  useEffect(() => {
    const container = divRef.current;
    if (!container) return;

    const blocks = container.querySelectorAll<HTMLElement>('code.language-mermaid');
    if (blocks.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark ? 'dark' : 'default',
        });

        for (let i = 0; i < blocks.length; i += 1) {
          const code = blocks[i];
          const target = code.closest('pre') ?? code;
          // textContent, а не innerHTML — mermaid нужен исходный текст без HTML-эскейпа.
          const source = code.textContent ?? '';
          try {
            const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, source);
            if (cancelled) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid';
            wrapper.innerHTML = svg;
            target.replaceWith(wrapper);
          } catch {
            // Некорректная диаграмма — оставляем исходный код-блок как есть.
          }
        }
      } catch (error) {
        console.error('Не удалось загрузить mermaid:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, isDark]);

  return (
    <div
      className={style.wrapper}
      onClick={handleClick}
    >
      <YfmStaticView
        ref={divRef}
        html={html}
        className="demo-preview"
      />
    </div>
  );
};

export default MarkdownPreview;
