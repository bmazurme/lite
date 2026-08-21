import { Pagination, type PaginationProps, Skeleton, Text } from '@gravity-ui/uikit';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import Note from '../../components/note/note';
import PageMeta from '../../components/page-meta';
import Tag from '../../components/tag/tag';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toaster } from '../../main';
import { notesSelector, setNotes } from '../../store';
import { useGetNotesByTagMutation } from '../../store/api/notes-api/endpoints';

import style from './tag-notes-page.module.css';

export default function TagNotesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notes = useAppSelector(notesSelector);

  const [searchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [state, setState] = useState({ page: pageFromUrl, pageSize: 10, total: 0 });

  const [getNotesByTag, { isLoading }] = useGetNotesByTagMutation();

  useEffect(() => {
    if (!slug) return;

    const fetch = async () => {
      try {
        const { data, total } = await getNotesByTag({ slug, page: state.page }).unwrap();
        dispatch(setNotes({ notes: data }));
        setState((prev) => ({ ...prev, total }));
      } catch {
        toaster.add({
          name: 'fetch-notes-by-tag-error',
          title: 'Не удалось загрузить заметки',
          theme: 'danger',
        });
      }
    };

    fetch();
  }, [slug, state.page, getNotesByTag, dispatch]);

  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) => {
    setState((prev) => ({ ...prev, page, pageSize }));
    navigate(`/notes/tag/${slug}?page=${page}`);
  };

  return (
    <ContentWrapper sidebar>
      <PageMeta title={`Заметки по тегу #${slug}`} />
      <main
        className="main"
        aria-label="Заметки по тегу"
        aria-live="polite"
      >
        <div className={style.filterBar}>
          <Text
            variant="body-1"
            color="secondary"
          >
            Filtered by
          </Text>
          <Tag
            name={slug ?? ''}
            active
            onRemove={() => navigate('/')}
          />
        </div>

        {isLoading
          ? (
            <Skeleton className={style.skeleton} />
          )
          : notes.length === 0
            ? (
              <Text
                className={style.empty}
                variant="body-1"
                color="secondary"
              >
                Нет заметок с этим тегом
              </Text>
            )
            : notes.map((note) => (
                <Note
                  key={note.id}
                  note={note}
                />
              ))}

        {state.total > state.pageSize && (
          <Pagination
            page={state.page}
            pageSize={state.pageSize}
            total={state.total}
            onUpdate={handleUpdate}
            aria-label="Навигация по страницам"
          />
        )}
      </main>
    </ContentWrapper>
  );
}
