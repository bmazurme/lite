import { Pagination, type PaginationProps, Skeleton } from '@gravity-ui/uikit';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../hooks';
import { toaster } from '../../main';
import { notesSelector, setNotes } from '../../store';
import { useGetNotesByPageMutation } from '../../store/api/notes-api/endpoints';
import Note from '../note/note';

import type { NotesProps } from './notes-props';
import style from './notes.module.css';

export default function Notes({ page: forcedPage }: NotesProps) {
  const dispatch = useAppDispatch();
  const notes = useAppSelector(notesSelector);

  const [getNotesByPage, { isLoading }] = useGetNotesByPageMutation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = forcedPage !== undefined ? forcedPage : pageFromUrl;
  const [state, setState] = useState({ page: currentPage, pageSize: 10, total: 0 });

  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) => {
    setState((prevState) => ({ ...prevState, page, pageSize }));
    if (page === 1) {
      navigate('/');
    } else {
      navigate(`/notes?page=${page}`);
    }
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data, total } = await getNotesByPage(state.page).unwrap();
        dispatch(setNotes({ notes: data }));
        setState((prevState) => ({ ...prevState, total }));
      } catch {
        toaster.add({
          name: 'fetch-notes-error',
          title: 'Не удалось загрузить заметки',
          theme: 'danger',
        });
      }
    };

    fetchNotes();
  }, [state.page, getNotesByPage, dispatch]);

  return (
    <main
      className="main"
      aria-label="Список заметок"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`blog-post ${style.skeleton}`}
            />
          ))
        : notes?.map((note) => (
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
          aria-label="Навигация по страницам заметок"
        />
      )}
    </main>
  );
}
