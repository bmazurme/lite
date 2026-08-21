/* eslint-disable react-hooks/set-state-in-effect */
import { Check, Pencil, Plus, TrashBin } from '@gravity-ui/icons';
import { Button, Icon, Text, TextInput } from '@gravity-ui/uikit';
import { useCallback, useEffect, useState } from 'react';

import ConfirmDeleteModal from '../../components/confirm-delete-modal';
import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';
import ProtectedWrapper from '../../components/protected-wrapper';
import RedirectToLogin from '../../components/redirect-to-login';
import { useAppDispatch } from '../../hooks';
import { toaster } from '../../main';
import {
  setTypes,
  useCreateTypeMutation,
  useDeleteTypeMutation,
  useGetTypesMutation,
  useUpdateTypeMutation,
  type TypeResponse,
} from '../../store';

import style from './types-admin-page.module.css';

function TypesAdminPage() {
  const dispatch = useAppDispatch();
  const [getTypes] = useGetTypesMutation();
  const [createType, { isLoading: isCreating }] = useCreateTypeMutation();
  const [updateType, { isLoading: isUpdating }] = useUpdateTypeMutation();
  const [deleteType, { isLoading: isDeleting }] = useDeleteTypeMutation();

  const [types, setLocalTypes] = useState<TypeResponse[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4aa1f2');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#4aa1f2');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const refreshTypes = useCallback(async () => {
    try {
      const data = await getTypes().unwrap();
      setLocalTypes(data);
      dispatch(setTypes(data));
    } catch {
      toaster.add({
        name: 'fetch-types-error',
        title: 'Не удалось загрузить типы',
        theme: 'danger',
      });
    }
  }, [getTypes, dispatch]);

  useEffect(() => {
    refreshTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    try {
      await createType({ name, color: newColor }).unwrap();
      setNewName('');
      setNewColor('#4aa1f2');
      await refreshTypes();
      toaster.add({
        name: 'create-type-success',
        title: 'Тип создан',
        theme: 'success',
      });
    } catch {
      toaster.add({
        name: 'create-type-error',
        title: 'Не удалось создать тип',
        theme: 'danger',
      });
    }
  };

  const handleStartEdit = (type: TypeResponse) => {
    setEditId(type.id);
    setEditName(type.name);
    setEditColor(type.color);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditColor('#4aa1f2');
  };

  const handleSaveEdit = async () => {
    const name = editName.trim();
    if (editId === null || !name) return;

    try {
      await updateType({ id: editId, name, color: editColor }).unwrap();
      handleCancelEdit();
      await refreshTypes();
      toaster.add({
        name: 'update-type-success',
        title: 'Тип обновлён',
        theme: 'success',
      });
    } catch {
      toaster.add({
        name: 'update-type-error',
        title: 'Не удалось обновить тип',
        theme: 'danger',
      });
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteType(deleteId).unwrap();
      setDeleteId(null);
      await refreshTypes();
      toaster.add({
        name: 'delete-type-success',
        title: 'Тип удалён',
        theme: 'success',
      });
    } catch {
      toaster.add({
        name: 'delete-type-error',
        title: 'Не удалось удалить тип',
        theme: 'danger',
      });
    }
  };

  return (
    <ContentWrapper
      sidebar
      children={(
        <ProtectedWrapper fallback={<RedirectToLogin />}>
          <PageMeta title="Управление типами" noindex />
          <div className={style.container}>
            <Text variant="header-2">Типы заметок</Text>

            <div className={style.addRow}>
              <TextInput
                placeholder="Название нового типа"
                value={newName}
                onUpdate={setNewName}
              />
              <input
                type="color"
                className={style.colorInput}
                aria-label="Цвет нового типа"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
              <Button
                view="action"
                size="m"
                disabled={!newName.trim()}
                loading={isCreating}
                onClick={handleCreate}
              >
                <Icon
                  data={Plus}
                  size={14}
                  aria-hidden="true"
                />
                Добавить
              </Button>
            </div>

            <ul className={style.list}>
              {types.map((type) => (
                <li
                  key={type.id}
                  className={style.row}
                >
                  {editId === type.id
                    ? (
                      <>
                        <TextInput
                          value={editName}
                          onUpdate={setEditName}
                        />
                        <input
                          type="color"
                          className={style.colorInput}
                          aria-label={`Цвет типа: ${type.name}`}
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
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
                        <div className={style.typeInfo}>
                          <span
                            className={style.colorSwatch}
                            style={{ backgroundColor: type.color }}
                            aria-hidden="true"
                          />
                          <Text>{type.name}</Text>
                        </div>
                        <div className={style.actions}>
                          <Button
                            view="outlined"
                            size="m"
                            aria-label={`Редактировать тип: ${type.name}`}
                            onClick={() => handleStartEdit(type)}
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
                            aria-label={`Удалить тип: ${type.name}`}
                            onClick={() => setDeleteId(type.id)}
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
          </div>

          <ConfirmDeleteModal
            open={deleteId !== null}
            isLoading={isDeleting}
            title="Удалить тип?"
            description="Заметки этого типа потеряют категорию. Это действие нельзя отменить."
            onConfirm={handleDelete}
            onClose={() => setDeleteId(null)}
          />
        </ProtectedWrapper>
      )}
    />
  );
}

export default TypesAdminPage;
