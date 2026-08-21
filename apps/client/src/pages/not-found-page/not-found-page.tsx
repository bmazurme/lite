import { Button, Text } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta title="404 — Страница не найдена" noindex />
      <ContentWrapper
        children={(
          <section className="error">
            <Text variant="header-2">
              404
            </Text>
            <Text variant="header-1">
              Страница не найдена
            </Text>
            <Text variant="body-3">
              К сожалению, запрошенная страница не существует или была перемещена.
            </Text>
            <Button
              view="outlined-action"
              size="m"
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>
          </section>
        )}
      />
    </>
  );
}

export default NotFoundPage;
