import { Pagination, type PaginationProps, Skeleton, Text } from '@gravity-ui/uikit';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import Note from '../../components/note/note';
import PageMeta from '../../components/page-meta';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toaster } from '../../main';
import { notesSelector, setNotes } from '../../store';
import { useGetNotesByTypeMutation } from '../../store/api/notes-api/endpoints';

import style from './type-notes-page.module.css';

export default function TypeNotesPage() {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notes = useAppSelector(notesSelector);

  const [searchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [state, setState] = useState({ page: pageFromUrl, pageSize: 10, total: 0 });

  const [getNotesByType, { isLoading }] = useGetNotesByTypeMutation();

  useEffect(() => {
    if (!typeId) return;

    const fetch = async () => {
      try {
        const { data, total } = await getNotesByType({ typeId: +typeId, page: state.page }).unwrap();
        dispatch(setNotes({ notes: data }));
        setState((prev) => ({ ...prev, total }));
      } catch {
        toaster.add({
          name: 'fetch-notes-by-type-error',
          title: 'Не удалось загрузить заметки',
          theme: 'danger',
        });
      }
    };

    fetch();
  }, [typeId, state.page, getNotesByType, dispatch]);

  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) => {
    setState((prev) => ({ ...prev, page, pageSize }));
    navigate(`/notes/type/${typeId}?page=${page}`);
  };

  return (
    <ContentWrapper sidebar>
      <PageMeta title="Заметки по типу" />
      <main
        className="main"
        aria-label="Заметки по типу"
        aria-live="polite"
      >
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
                Нет заметок этого типа
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
