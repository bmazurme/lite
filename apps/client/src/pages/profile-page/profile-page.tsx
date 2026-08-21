/* eslint-disable react-hooks/set-state-in-effect */
import { Gear, Tag } from '@gravity-ui/icons';
import {
  Button, Card, Icon, Skeleton, Text, TextInput,
} from '@gravity-ui/uikit';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';
import ProtectedWrapper from '../../components/protected-wrapper';
import RedirectToLogin from '../../components/redirect-to-login';
import { useIsAuthenticated } from '../../hooks/use-is-authenticated';
import { toaster } from '../../main';
import { useGetNotesByPageMutation } from '../../store/api/notes-api/endpoints';
import {
  useGetUserInfoMutation,
  useUpdateUserMutation,
} from '../../store/api/users-api/endpoints';

import style from './profile.module.css';

function ProfilePage() {
  const navigate = useNavigate();
  const [getUserInfo, { isLoading: isUserLoading }] = useGetUserInfoMutation();
  const [updateUser] = useUpdateUserMutation();
  const [getNotesByPage, { isLoading: isNotesLoading }] = useGetNotesByPageMutation();
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [notesTotal, setNotesTotal] = useState<number | null>(null);
  const { isAuthenticated } = useIsAuthenticated();

  const handleGetUserInfo = useCallback(async () => {
    try {
      const response = await getUserInfo().unwrap();
      setUserId(response.id);
      setUsername(response.username);
      setStatus(response.status);
      setSavedStatus(response.status);
    } catch {
      toaster.add({
        name: 'get-user-info-error',
        title: 'Не удалось загрузить профиль',
        theme: 'danger',
      });
    }
  }, [getUserInfo]);

  const handleGetNotesTotal = useCallback(async () => {
    try {
      const { total } = await getNotesByPage(1).unwrap();
      setNotesTotal(total);
    } catch {
      toaster.add({
        name: 'get-notes-total-error',
        title: 'Не удалось загрузить количество заметок',
        theme: 'danger',
      });
    }
  }, [getNotesByPage]);

  const handleStatusBlur = useCallback(async () => {
    if (userId === null || status === null || status === savedStatus) return;
    try {
      await updateUser({ id: userId, status }).unwrap();
      setSavedStatus(status);
      toaster.add({
        name: 'update-status-success',
        title: 'Статус обновлён',
        theme: 'success',
      });
    } catch {
      toaster.add({
        name: 'update-status-error',
        title: 'Не удалось сохранить статус',
        theme: 'danger',
      });
    }
  }, [userId, status, savedStatus, updateUser]);

  useEffect(() => {
    if (isAuthenticated) {
      handleGetUserInfo();
      handleGetNotesTotal();
    }
  }, [isAuthenticated, handleGetUserInfo, handleGetNotesTotal]);

  const initial = username?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <ContentWrapper
      children={(
        <section id="center">
          <PageMeta title="Профиль" noindex />
          <ProtectedWrapper fallback={<RedirectToLogin />}>
            <div className={style.page}>
              <Card
                className={style.card}
                type="container"
                size="l"
              >
                <div className={style.identity}>
                  <div
                    className={style.avatar}
                    aria-hidden="true"
                  >
                    {isUserLoading ? '' : initial}
                  </div>
                  <div className={style.identityText}>
                    {isUserLoading
                      ? <Skeleton className={style.nameSkeleton} />
                      : (
                        <Text
                          variant="header-2"
                          ellipsis
                        >
                          {username ?? '—'}
                        </Text>
                      )}
                    <Text
                      color="secondary"
                      ellipsis
                    >
                      {isUserLoading
                        ? ' '
                        : (savedStatus?.trim() || 'Статус не указан')}
                    </Text>
                  </div>
                  <div className={style.stat}>
                    {isNotesLoading
                      ? <Skeleton className={style.statSkeleton} />
                      : (
                        <Text
                          variant="display-1"
                          className={style.statValue}
                        >
                          {notesTotal ?? '—'}
                        </Text>
                      )}
                    <Text
                      variant="caption-2"
                      color="secondary"
                    >
                      заметок
                    </Text>
                  </div>
                </div>
              </Card>

              <Card
                className={style.card}
                type="container"
                size="l"
              >
                <Text variant="subheader-2">Аккаунт</Text>
                <div className={style.fields}>
                  <TextInput
                    label="Email"
                    size="l"
                    disabled
                    value={username ?? '—'}
                  />
                  <TextInput
                    label="Статус"
                    size="l"
                    placeholder="Расскажите о себе"
                    value={status ?? ''}
                    note="Короткая подпись, видимая в вашем профиле"
                    onUpdate={setStatus}
                    onBlur={handleStatusBlur}
                  />
                </div>
              </Card>

              <Card
                className={style.card}
                type="container"
                size="l"
              >
                <Text variant="subheader-2">Администрирование</Text>
                <div className={style.adminActions}>
                  <Button
                    view="outlined-action"
                    size="l"
                    width="max"
                    onClick={() => navigate('/admin/types')}
                  >
                    <Icon
                      data={Gear}
                      size={16}
                      aria-hidden="true"
                    />
                    Управление типами
                  </Button>
                  <Button
                    view="outlined-action"
                    size="l"
                    width="max"
                    onClick={() => navigate('/admin/tags')}
                  >
                    <Icon
                      data={Tag}
                      size={16}
                      aria-hidden="true"
                    />
                    Управление тегами
                  </Button>
                </div>
              </Card>
            </div>
          </ProtectedWrapper>
        </section>
      )}
      sidebar
    />
  );
}

export default ProfilePage;
