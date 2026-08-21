import { Pagination, type PaginationProps, Skeleton, Text } from '@gravity-ui/uikit';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import Note from '../../components/note/note';
import PageMeta from '../../components/page-meta';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toaster } from '../../main';
import { notesSelector, setNotes } from '../../store';
import { useSearchNotesMutation } from '../../store/api/notes-api/endpoints';

import style from './search-notes-page.module.css';

export default function SearchNotesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notes = useAppSelector(notesSelector);

  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const [state, setState] = useState({ page: pageFromUrl, pageSize: 10, total: 0 });

  const [searchNotes, { isLoading }] = useSearchNotesMutation();

  useEffect(() => {
    if (!query.trim()) {
      dispatch(setNotes({ notes: [] }));
      return;
    }

    const fetch = async () => {
      try {
        const { data, total } = await searchNotes({ q: query, page: state.page }).unwrap();
        dispatch(setNotes({ notes: data }));
        setState((prev) => ({ ...prev, total }));
      } catch {
        toaster.add({
          name: 'search-notes-error',
          title: 'Не удалось выполнить поиск',
          theme: 'danger',
        });
      }
    };

    fetch();
  }, [query, state.page, searchNotes, dispatch]);

  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) => {
    setState((prev) => ({ ...prev, page, pageSize }));
    navigate(`/search?q=${encodeURIComponent(query)}&page=${page}`);
  };

  return (
    <ContentWrapper sidebar>
      <PageMeta
        title={`Поиск: ${query}`}
        noindex
      />
      <main
        className="main"
        aria-label="Результаты поиска"
        aria-live="polite"
      >
        <Text
          variant="header-2"
          className={style.heading}
        >
          {`Поиск: «${query}»`}
        </Text>

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
                Ничего не найдено
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
