/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import ContentWrapper from './ContentWrapper';

import style from './ErrorBoundaryWrapper.module.css';

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
        <section>
          <h2 className={style.title}>APP-ERROR</h2>
          <p className={style.message}>{errorMessage}</p>
          <div className={style.block}>
            Try to
            <button
              className="counter"
              onClick={resetErrorBoundary}
            >
              Reload app
            </button>
            or
            <button className="counter" onClick={navigateHome}>
              Go to homepage
            </button>
          </div>
        </section>
      )}
    />
  );
}

export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onReset={() => console.log('reset')}
      FallbackComponent={ErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}
