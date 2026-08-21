import type { RootState } from '../store';

import { useAppSelector } from '.';

/**
 * Хук для проверки, авторизован ли пользователь
 * @returns {boolean} true, если пользователь авторизован
 */
export const useIsAuthenticated = (): { isAuthenticated: boolean; isChecking: boolean } => {
  const isAuthenticated = useAppSelector((state: RootState) => state.auth.isAuthenticated);
  const status = useAppSelector((state: RootState) => state.auth.status);

  return {
    isAuthenticated,
    isChecking: status === 'checking'
  };
};
