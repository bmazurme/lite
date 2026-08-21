import { Button, Card, Loader, Text } from '@gravity-ui/uikit';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';
import ProtectedWrapper from '../../components/protected-wrapper';
import { useGetNoteByTitleQuery } from '../../store/api/notes-api/endpoints';

import style from './wiki-resolve-page.module.css';

/**
 * Резолвер вики-ссылок `[[Заголовок]]`. Находит заметку по заголовку и
 * перенаправляет на её канонический адрес; если заметки нет — предлагает
 * создать её (для авторизованных).
 */
export default function WikiResolvePage() {
  const { title = '' } = useParams();
  const navigate = useNavigate();
  const decodedTitle = decodeURIComponent(title);

  const { data, isLoading, isError } = useGetNoteByTitleQuery(decodedTitle, {
    skip: !decodedTitle,
  });

  useEffect(() => {
    if (data?.slug) {
      navigate(`/n/${data.slug}`, { replace: true });
    }
  }, [data, navigate]);

  return (
    <ContentWrapper sidebar>
      <PageMeta title={`Ссылка: ${decodedTitle}`} noindex />
      <main className="main">
        {isLoading || data ? (
          <div className={style.center}>
            <Loader size="l" />
          </div>
        ) : isError ? (
          <Card
            className="blog-post"
            type="container"
            size="l"
          >
            <Text
              variant="header-2"
              className={style.heading}
            >
              Заметка не найдена
            </Text>
            <Text
              variant="body-1"
              color="secondary"
              className={style.text}
            >
              {`Заметки с заголовком «${decodedTitle}» пока нет.`}
            </Text>
            <div className={style.actions}>
              <Button
                view="flat"
                size="m"
                onClick={() => navigate(-1)}
              >
                Назад
              </Button>
              <ProtectedWrapper>
                <Button
                  view="action"
                  size="m"
                  onClick={() => navigate('/add-note')}
                >
                  Создать заметку
                </Button>
              </ProtectedWrapper>
            </div>
          </Card>
        ) : null}
      </main>
    </ContentWrapper>
  );
}
