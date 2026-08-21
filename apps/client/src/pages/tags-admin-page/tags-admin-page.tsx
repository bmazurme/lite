/* eslint-disable react-hooks/set-state-in-effect */
import { Check, Pencil, TrashBin } from '@gravity-ui/icons';
import { Button, Icon, Label, Text, TextInput } from '@gravity-ui/uikit';
import { useCallback, useEffect, useState } from 'react';

import ConfirmDeleteModal from '../../components/confirm-delete-modal';
import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';
import ProtectedWrapper from '../../components/protected-wrapper';
import RedirectToLogin from '../../components/redirect-to-login';
import { toaster } from '../../main';
import {
  useDeleteTagMutation,
  useGetTagsMutation,
  useUpdateTagMutation,
  type TagResponse,
} from '../../store';

import style from './tags-admin-page.module.css';

/** Склонение слова «заметка» под число. */
function declOfNum(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'заметка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'заметки';
  return 'заметок';
}

function TagsAdminPage() {
  const [getTags] = useGetTagsMutation();
  const [updateTag, { isLoading: isUpdating }] = useUpdateTagMutation();
  const [deleteTag, { isLoading: isDeleting }] = useDeleteTagMutation();

  const [tags, setLocalTags] = useState<TagResponse[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const refreshTags = useCallback(async () => {
    try {
      const data = await getTags().unwrap();
      setLocalTags(data);
    } catch {
      toaster.add({
        name: 'fetch-tags-error',
        title: 'Не удалось загрузить теги',
        theme: 'danger',
      });
    }
  }, [getTags]);

  useEffect(() => {
    refreshTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartEdit = (tag: TagResponse) => {
    setEditId(tag.id);
    setEditName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditName('');
  };

  const handleSaveEdit = async () => {
    const name = editName.trim().replace(/\s+/g, ' ');
    if (editId === null || !name) return;

    try {
      await updateTag({ id: editId, name }).unwrap();
      handleCancelEdit();
      await refreshTags();
      toaster.add({
        name: 'update-tag-success',
        title: 'Тег переименован',
        theme: 'success',
      });
    } catch {
      toaster.add({
        name: 'update-tag-error',
        title: 'Не удалось переименовать тег',
        theme: 'danger',
      });
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteTag(deleteId).unwrap();
      setDeleteId(null);
      await refreshTags();
      toaster.add({
        name: 'delete-tag-success',
        title: 'Тег удалён',
        theme: 'success',
      });
    } catch {
      toaster.add({
        name: 'delete-tag-error',
        title: 'Не удалось удалить тег',
        theme: 'danger',
      });
    }
  };

  const deleteTarget = tags.find((tag) => tag.id === deleteId) ?? null;

  return (
    <ContentWrapper
      sidebar
      children={(
        <ProtectedWrapper fallback={<RedirectToLogin />}>
          <PageMeta title="Управление тегами" noindex />
          <div className={style.container}>
            <Text variant="header-2">Теги</Text>

            {tags.length === 0
              ? (
                <Text
                  variant="body-1"
                  color="secondary"
                >
                  Пока нет ни одного тега. Теги создаются автоматически при добавлении их к заметкам.
                </Text>
              )
              : (
                <ul className={style.list}>
                  {tags.map((tag) => (
                    <li
                      key={tag.id}
                      className={style.row}
                    >
                      {editId === tag.id
                        ? (
                          <>
                            <TextInput
                              value={editName}
                              autoFocus
                              onUpdate={setEditName}
                            />
                            <div className={style.actions}>
                              <Button
                                view="action"
                                size="m"
                                aria-label="Сохранить"
                                disabled={!editName.trim()}
                                loading={isUpdating}
                                onClick={handleSaveEdit}
                              >
                                <Icon
                                  data={Check}
                                  size={14}
                                  aria-hidden="true"
                                />
                              </Button>
                              <Button
                                view="normal"
                                size="m"
                                aria-label="Отмена"
                                disabled={isUpdating}
                                onClick={handleCancelEdit}
                              >
                                Отмена
                              </Button>
                            </div>
                          </>
                        )
                        : (
                          <>
                            <div className={style.tagInfo}>
                              <Label
                                theme="info"
                                size="m"
                              >
                                {tag.name}
                              </Label>
                              {typeof tag.count === 'number' && (
                                <Text
                                  variant="caption-2"
                                  color="secondary"
                                >
                                  {tag.count}
                                  {' '}
                                  {declOfNum(tag.count)}
                                </Text>
                              )}
                            </div>
                            <div className={style.actions}>
                              <Button
                                view="outlined"
                                size="m"
                                aria-label={`Переименовать тег: ${tag.name}`}
                                onClick={() => handleStartEdit(tag)}
                              >
                                <Icon
                                  data={Pencil}
                                  size={14}
                                  aria-hidden="true"
                                />
                              </Button>
                              <Button
                                view="outlined-danger"
                                size="m"
                                aria-label={`Удалить тег: ${tag.name}`}
                                onClick={() => setDeleteId(tag.id)}
                              >
                                <Icon
                                  data={TrashBin}
                                  size={14}
                                  aria-hidden="true"
                                />
                              </Button>
                            </div>
                          </>
                        )}
                    </li>
                  ))}
                </ul>
              )}
          </div>

          <ConfirmDeleteModal
            open={deleteId !== null}
            isLoading={isDeleting}
            title="Удалить тег?"
            description={
              deleteTarget
                ? `Тег «${deleteTarget.name}» будет удалён из всех заметок. Это действие нельзя отменить.`
                : 'Это действие нельзя отменить.'
            }
            onConfirm={handleDelete}
            onClose={() => setDeleteId(null)}
          />
        </ProtectedWrapper>
      )}
    />
  );
}

export default TagsAdminPage;
