import { Plus, CircleFill, Layers, Magnifier } from '@gravity-ui/icons';
import { Button, Icon, Skeleton, TextInput } from '@gravity-ui/uikit';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams, useMatch, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../hooks';
import { toaster } from '../../main';
import {
  setTags,
  setTypes,
  tagsSelector,
  typesSelector,
  useGetTagsMutation,
  useGetTypesMutation,
} from '../../store';
import ProtectedWrapper from '../protected-wrapper';
import Tag from '../tag/tag';

import style from './sidebar.module.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { typeId } = useParams();
  const isAllNotes = !useMatch('/notes/type/:typeId');
  const tagMatch = useMatch('/notes/tag/:slug');
  const activeTagSlug = tagMatch?.params.slug;
  const dispatch = useAppDispatch();
  const types = useAppSelector(typesSelector);
  const tags = useAppSelector(tagsSelector);
  const [getTypes, { isLoading: isTypesLoading }] = useGetTypesMutation();
  const [getTags] = useGetTagsMutation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await getTypes().unwrap();
        dispatch(setTypes(types));
      } catch {
        toaster.add({
          name: 'fetch-types-error',
          title: 'Не удалось загрузить типы',
          theme: 'danger',
        });
      }
    };

    const fetchTags = async () => {
      try {
        const tags = await getTags().unwrap();
        dispatch(setTags(tags));
      } catch {
        // Облако тегов необязательно — молча игнорируем ошибку.
      }
    };

    fetchTypes();
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav
      className="sidebar"
      aria-label="Фильтрация заметок"
    >
      <TextInput
        type="search"
        size="l"
        placeholder="Search notes..."
        value={searchQuery}
        onUpdate={setSearchQuery}
        onKeyDown={handleSearchKeyDown}
        hasClear
        startContent={(
          <Icon
            data={Magnifier}
            size={16}
            aria-hidden="true"
            className={style.searchIcon}
          />
        )}
        aria-label="Поиск по заметкам"
      />

      <ProtectedWrapper>
        <Button
          view="action"
          size="l"
          aria-label="Создать новую заметку"
          onClick={() => navigate('/add-note')}
        >
          <Icon
            data={Plus}
            size={14}
            aria-hidden="true"
          />
          Add Note
        </Button>
      </ProtectedWrapper>

      <Button
        view={isAllNotes ? 'normal' : 'flat'}
        size="m"
        className={style.navButton}
        aria-current={isAllNotes ? 'page' : undefined}
        onClick={() => navigate('/')}
      >
        <Icon
          data={Layers}
          size={14}
          aria-hidden="true"
        />
        All notes
      </Button>

      {isTypesLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className={style.skeleton}
            />
          ))
        : types.map((type) => {
            const isActive = typeId === String(type.id);
            return (
              <Button
                key={type.id}
                view={isActive ? 'normal' : 'flat'}
                size="m"
                className={style.navButton}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(`/notes/type/${type.id}`)}
              >
                <Icon
                  data={CircleFill}
                  size={12}
                  aria-hidden="true"
                  style={{ color: type.color }}
                />
                {type.name}
              </Button>
            );
          })}

      {tags.length > 0 && (
        <>
          <div className={style.sectionTitle}>Tags</div>
          <div className={style.tagList}>
            {tags.map((tag) => (
              <Tag
                key={tag.id}
                variant="row"
                name={tag.name}
                count={tag.count}
                active={activeTagSlug === tag.slug}
                onClick={() => navigate(`/notes/tag/${tag.slug}`)}
              />
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
