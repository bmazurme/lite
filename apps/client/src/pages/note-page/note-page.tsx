import { Pencil, TrashBin, ArrowLeft, CircleFill, Link as LinkIcon } from '@gravity-ui/icons';
import { Button, Card, Icon, Label, Skeleton, Text } from '@gravity-ui/uikit';
import { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import ConfirmDeleteModal from '../../components/confirm-delete-modal';
import ContentWrapper from '../../components/content-wrapper';
import MarkdownPreview from '../../components/markdown-preview/markdown-preview';
import { MARKDOWN_SETTINGS } from '../../components/note/markdown-settings';
import PageMeta from '../../components/page-meta';
import ProtectedWrapper from '../../components/protected-wrapper';
import RelatedNotes from '../../components/related-notes/related-notes';
import Tag from '../../components/tag/tag';
import { toaster } from '../../main';
import {
  useGetNoteByIdQuery,
  useGetNoteBySlugQuery,
  useDeleteNoteMutation,
} from '../../store/api/notes-api/endpoints';
import { SITE_URL } from '../../utils/constants';
import { toAbsoluteImageUrl, toRelativeImageUrl } from '../../utils/image-url';

import style from './note-page.module.css';

/** Форматирует ISO-дату как «ГГГГ-ММ» (напр. 2026-07). */
function formatYearMonth(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

export default function NotePage() {
  const { noteId, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Поддерживаем оба маршрута: канонический /n/:slug и старый /note/:noteId.
  const bySlug = useGetNoteBySlugQuery(slug!, { skip: !slug });
  const byId = useGetNoteByIdQuery(+noteId!, { skip: !noteId });
  const { data, isLoading } = slug ? bySlug : byId;

  const resolvedId = data?.id;

  // Канонический адрес заметки не зависит ни от маршрута (/note/:id или /n/:slug),
  // ни от хоста, по которому открыта страница — всегда SITE_URL + /n/:slug.
  const canonicalUrl = data?.slug ? `${SITE_URL}/n/${data.slug}` : undefined;

  // Строка «Дата проверки … · Обновлено …» формируется автоматически:
  // «Обновлено» — из updatedAt, «Дата проверки» — из reviewedAt (если задана).
  const reviewedYm = formatYearMonth(data?.reviewedAt);
  const updatedYm = formatYearMonth(data?.updatedAt);
  const metaLine = [
    reviewedYm && `Дата проверки: ${reviewedYm}`,
    updatedYm && `Обновлено: ${updatedYm}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleShare = useCallback(() => {
    if (!data?.slug) return;
    const url = `${SITE_URL}/n/${data.slug}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        toaster.add({
          name: 'share-note',
          title: 'Ссылка скопирована',
          theme: 'success',
        });
      })
      .catch(() => {
        toaster.add({
          name: 'share-note-error',
          title: 'Не удалось скопировать ссылку',
          theme: 'danger',
        });
      });
  }, [data]);

  const canGoBack = location.key !== 'default';
  const handleBack = useCallback(() => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate, canGoBack]);

  const handleDelete = async () => {
    if (!resolvedId) return;
    try {
      await deleteNote(resolvedId).unwrap();
      setConfirmOpen(false);
      navigate('/notes');
    } catch {
      toaster.add({
        name: 'delete-note-error',
        title: 'Не удалось удалить заметку',
        theme: 'danger',
      });
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <PageMeta
        title={data?.title ?? 'Заметка'}
        description={data?.preview}
        type="article"
        section={data?.type?.name}
        publishedTime={data?.createdAt}
        url={canonicalUrl}
        image={data?.coverImage ?? undefined}
      />
      {data && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: data.title,
              description: data.preview,
              image: toAbsoluteImageUrl(data.coverImage),
              datePublished: data.createdAt,
              dateModified: data.updatedAt,
              articleSection: data.type?.name,
              url: canonicalUrl,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': canonicalUrl,
              },
            })}
          </script>
        </Helmet>
      )}
      <ContentWrapper
        children={(
          <Card
            className="blog-post"
            type="container"
            size="l"
          >
            <div className={style.header}>
              <div className={style.navigation}>
                <Button
                  view="flat"
                  size="s"
                  aria-label="Вернуться к списку заметок"
                  onClick={handleBack}
                >
                  <Icon
                    data={ArrowLeft}
                    size={14}
                    aria-hidden="true"
                  />
                  All notes
                </Button>
                {data?.type && (
                  <span style={{ '--type-color': data.type.color } as React.CSSProperties}>
                    <Label
                      className="type-label"
                      icon={(
                        <Icon
                          size={14}
                          data={CircleFill}
                          aria-hidden="true"
                          style={{ color: data.type.color }}
                        />
                      )}
                    >
                      {data.type.name}
                    </Label>
                  </span>
                )}
                {data?.published === false && (
                  <Label theme="warning">
                    Черновик
                  </Label>
                )}
              </div>
              <div className={style.tools}>
                <Button
                  view="outlined"
                  size="s"
                  aria-label={`Поделиться заметкой: ${data?.title}`}
                  disabled={!data?.slug}
                  onClick={handleShare}
                >
                  <Icon
                    data={LinkIcon}
                    size={14}
                    aria-hidden="true"
                  />
                  Share
                </Button>
                <ProtectedWrapper>
                  <Button
                    view="outlined-action"
                    size="s"
                    aria-label={`Редактировать заметку: ${data?.title}`}
                    onClick={() => navigate(`/edit-note/${resolvedId}`)}
                  >
                    <Icon
                      data={Pencil}
                      size={14}
                      aria-hidden="true"
                    />
                    Edit
                  </Button>
                  <Button
                    view="outlined-danger"
                    size="s"
                    aria-label={`Удалить заметку: ${data?.title}`}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Icon
                      data={TrashBin}
                      size={14}
                      aria-hidden="true"
                    />
                    Delete
                  </Button>
                </ProtectedWrapper>
              </div>
            </div>

            {data?.coverImage && (
              <figure className={style.cover}>
                <img
                  className={style.coverImg}
                  src={toRelativeImageUrl(data.coverImage)}
                  alt={`Обложка заметки: ${data.title}`}
                  loading="lazy"
                />
              </figure>
            )}

            <div
              className="post-title"
              aria-busy={isLoading}
            >
              {isLoading
                ? (
                  <Skeleton
                    className={style.loader}
                    aria-label="Загрузка заголовка"
                  />
                )
                : (
                  <Text variant="header-1">
                    {data?.title}
                  </Text>
                )}
            </div>

            {data?.tags && data.tags.length > 0 && (
              <div className="post-tags">
                {data.tags.map((tag) => (
                  <Tag
                    key={tag.id}
                    name={tag.name}
                    onClick={() => navigate(`/notes/tag/${tag.slug}`)}
                  />
                ))}
              </div>
            )}

            {!isLoading && metaLine && (
              <Text
                as="p"
                variant="caption-2"
                color="secondary"
                className={style.meta}
              >
                {metaLine}
              </Text>
            )}

            <div
              className="post-excerpt"
              aria-busy={isLoading}
              aria-live="polite"
            >
              {isLoading
                ? (
                  <Skeleton
                    className={style.loaderContent}
                    aria-label="Загрузка содержимого"
                  />
                )
                : (
                  <MarkdownPreview
                    getValue={() => data?.content || ''}
                    {...MARKDOWN_SETTINGS}
                  />
                )}
            </div>

            <RelatedNotes notes={data?.relatedNotes} />

            {data?.backlinks && data.backlinks.length > 0 && (
              <div className="backlinks">
                <Text
                  variant="subheader-2"
                  className="backlinks-title"
                >
                  Обратные ссылки
                </Text>
                <nav
                  className="backlinks-list"
                  aria-label="Заметки, ссылающиеся на эту"
                >
                  {data.backlinks.map((backlink) => (
                    <Link
                      key={backlink.id}
                      className="backlink-item"
                      to={`/n/${backlink.slug}`}
                    >
                      <Icon
                        data={LinkIcon}
                        size={14}
                        aria-hidden="true"
                      />
                      {backlink.title}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </Card>
        )}
        sidebar
      />

      <ConfirmDeleteModal
        open={confirmOpen}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
