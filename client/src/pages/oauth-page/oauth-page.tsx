import { ArrowLeft, CircleCheckFill, Envelope, Key, ShieldCheck } from '@gravity-ui/icons';
import { Button, Icon, Loader, Text } from '@gravity-ui/uikit';
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ContentWrapper from '../../components/content-wrapper';
import PageMeta from '../../components/page-meta';
import { useIsAuthenticated } from '../../hooks/use-is-authenticated';
import { useTheme } from '../../hooks/use-theme';
import { VITE_TOKEN } from '../../utils/constants';

import style from './oauth-page.module.css';

/**
 * Яндекс возвращает ошибку в query-параметрах, если пользователь отказал в доступе
 * или ссылка авторизации собрана некорректно. Показываем понятный текст вместо кода.
 */
const OAUTH_ERRORS: Record<string, string> = {
  access_denied: 'Вы отменили вход. Попробуйте ещё раз, если это вышло случайно.',
  invalid_request: 'Ссылка авторизации некорректна. Обновите страницу и попробуйте снова.',
  unauthorized_client: 'Приложение не может выполнить вход. Обратитесь к администратору.',
  server_error: 'Яндекс временно недоступен. Попробуйте через несколько минут.',
  temporarily_unavailable: 'Яндекс временно недоступен. Попробуйте через несколько минут.',
};

const GUARANTEES = [
  { icon: ShieldCheck, text: 'Пароль вводится на стороне Яндекса — мы его не видим' },
  { icon: Envelope, text: 'Получаем только email — больше ничего из профиля' },
  { icon: Key, text: 'Доступ к редактированию — только у зарегистрированных авторов' },
];

const OauthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { isAuthenticated, isChecking } = useIsAuthenticated();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const oauthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${VITE_TOKEN}`;
  const errorCode = searchParams.get('error');
  const errorText = errorCode
    ? OAUTH_ERRORS[errorCode] ?? 'Не удалось выполнить вход. Попробуйте ещё раз.'
    : null;

  /**
   * Переход на Яндекс занимает заметное время: показываем «Перенаправляем…»,
   * чтобы пользователь не кликал по кнопке повторно.
   */
  const handleAuthorize = useCallback(() => {
    setIsRedirecting(true);
  }, []);

  /**
   * navigate(-1) уводит из приложения, если страница открыта по прямой ссылке
   * (истории нет). Тогда возвращаемся на главную.
   */
  const handleBack = useCallback(() => {
    const hasHistory = typeof window !== 'undefined'
      && typeof window.history.state?.idx === 'number'
      && window.history.state.idx > 0;

    if (hasHistory) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <ContentWrapper>
      <PageMeta
        title="Вход"
        description="Войдите через Яндекс ID"
        noindex
      />
      <main className={style.page}>
        <div className={style.card}>
          <div className={style.brand}>
            <span
              className={style.brandMark}
              aria-hidden="true"
            >
              N
            </span>
            <div className={style.brandText}>
              <Text
                variant="subheader-3"
                as="h1"
              >
                Вход в NTLSTL
              </Text>
              <Text
                variant="body-1"
                color="secondary"
              >
                Developer notes
              </Text>
            </div>
          </div>

          {isChecking && (
            <div
              className={style.state}
              role="status"
              aria-live="polite"
            >
              <Loader size="m" />
              <Text
                variant="body-2"
                color="secondary"
              >
                Проверяем сессию…
              </Text>
            </div>
          )}

          {!isChecking && isAuthenticated && (
            <div
              className={style.state}
              role="status"
              aria-live="polite"
            >
              <Icon
                data={CircleCheckFill}
                size={28}
                className={style.successIcon}
                aria-hidden="true"
              />
              <Text
                variant="body-2"
                className={style.centered}
              >
                Вы уже вошли в аккаунт
              </Text>
              <div className={style.actions}>
                <Button
                  view="action"
                  size="l"
                  width="max"
                  onClick={() => navigate('/profile')}
                >
                  Перейти в профиль
                </Button>
                <Button
                  view="flat"
                  size="l"
                  width="max"
                  onClick={() => navigate('/')}
                >
                  К заметкам
                </Button>
              </div>
            </div>
          )}

          {!isChecking && !isAuthenticated && (
            <>
              {errorText && (
                <div
                  className={style.error}
                  role="alert"
                >
                  <Text variant="body-1">{errorText}</Text>
                </div>
              )}

              <Text
                variant="body-2"
                color="secondary"
                className={style.centered}
              >
                Войдите через Яндекс ID, чтобы создавать и редактировать заметки.
              </Text>

              <div className={style.authBlock}>
                <a
                  href={oauthUrl}
                  className={style.yandexButton}
                  aria-label="Войти с Яндекс ID"
                  aria-disabled={isRedirecting || undefined}
                  onClick={handleAuthorize}
                >
                  <img
                    src={isDark ? '/ya-oauth.svg' : '/ya-oauth-white.svg'}
                    alt="Войти с Яндекс ID"
                    width="135"
                    height="44"
                    className={style.yandexLogo}
                  />
                </a>

                <div
                  className={style.redirectHint}
                  role="status"
                  aria-live="polite"
                >
                  {isRedirecting && (
                    <>
                      <Loader size="s" />
                      <Text
                        variant="caption-2"
                        color="secondary"
                      >
                        Перенаправляем на Яндекс…
                      </Text>
                    </>
                  )}
                </div>
              </div>

              <ul className={style.guarantees}>
                {GUARANTEES.map(({ icon, text }) => (
                  <li
                    key={text}
                    className={style.guarantee}
                  >
                    <Icon
                      data={icon}
                      size={16}
                      className={style.guaranteeIcon}
                      aria-hidden="true"
                    />
                    <Text
                      variant="caption-2"
                      color="secondary"
                    >
                      {text}
                    </Text>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Button
          view="flat"
          size="m"
          className={style.back}
          onClick={handleBack}
        >
          <Icon
            data={ArrowLeft}
            size={14}
            aria-hidden="true"
          />
          Назад
        </Button>
      </main>
    </ContentWrapper>
  );
};

export default OauthPage;
