/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Text } from '@gravity-ui/uikit';
import type { PropsWithChildren } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

import ContentWrapper from '../content-wrapper';

import style from './error-boundary-wrapper.module.css';

type ErrorBoundaryWrapperProps = PropsWithChildren<unknown>;

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const getErrorMessage = (): string => {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      if ('message' in error) {
        return String((error as any).message);
      }

      if ('toString' in error && typeof (error as any).toString === 'function') {
        return (error as any).toString();
      }
    }

    return 'Произошла непредвиденная ошибка';
  };

  const errorMessage = getErrorMessage();
  const navigate = useNavigate();

  const navigateHome = () => {
    resetErrorBoundary();
    navigate('/');
  };

  return (
    <ContentWrapper
      children={(
        <section className="error">
          <Text variant="header-2">
            APP-ERROR
          </Text>
          <div className={style.description}>
            <Text variant="code-3">
              {errorMessage}
            </Text>
          </div>
          <div className={style.block}>
            <Text variant="subheader-2">
              Try to
            </Text>
            <Button
              view="outlined-utility"
              size="m"
              onClick={resetErrorBoundary}
            >
              Reload app
            </Button>
            <Text variant="subheader-2">
              or
            </Text>
            <Button
              view="outlined-action"
              size="m"
              onClick={navigateHome}
            >
              Go to homepage
            </Button>
          </div>
        </section>
      )}
    />
  );
}

export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onReset={() => () => {}}
      FallbackComponent={ErrorFallback}
    >
      <>{children}</>
    </ErrorBoundary>
  );
}
