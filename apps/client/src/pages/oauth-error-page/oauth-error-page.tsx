import { House, PersonXmark } from '@gravity-ui/icons';
import { Button, Icon, Text } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';

import style from './oauth-error-page.module.css';

function OauthErrorPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta title="Доступ запрещён" noindex />
      <ContentWrapper>
        <main className={style.page}>
          <div className={style.card}>
            <Icon
              data={PersonXmark}
              size={36}
              className={style.icon}
              aria-hidden="true"
            />
            <Text
              variant="subheader-3"
              as="h1"
            >
              Аккаунт не зарегистрирован
            </Text>
            <Text
              variant="body-2"
              color="secondary"
              className={style.description}
            >
              Вход через Яндекс прошёл успешно, но этого профиля нет в списке авторов.
              Читать заметки можно без входа — за доступом к редактированию обратитесь
              к администратору.
            </Text>
            <div className={style.actions}>
              <Button
                view="action"
                size="l"
                width="max"
                onClick={() => navigate('/oauth')}
              >
                Войти под другим аккаунтом
              </Button>
              <Button
                view="flat"
                size="l"
                width="max"
                onClick={() => navigate('/')}
              >
                <Icon
                  data={House}
                  size={16}
                  aria-hidden="true"
                />
                К заметкам
              </Button>
            </div>
            <Text
              variant="caption-2"
              color="secondary"
            >
              Код ошибки: 403
            </Text>
          </div>
        </main>
      </ContentWrapper>
    </>
  );
}

export default OauthErrorPage;
