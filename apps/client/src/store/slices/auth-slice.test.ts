import { describe, it, expect } from 'vitest';

import authReducer, {
  initialStateAuth,
  setCredentials,
  logout,
  setChecking,
} from './auth-slice';

describe('auth-slice', () => {
  it('возвращает начальное состояние', () => {
    expect(authReducer(undefined, { type: '@@init' })).toEqual(initialStateAuth);
  });

  it('setCredentials: устанавливает токен и флаг авторизации', () => {
    const state = authReducer(undefined, setCredentials({ accessToken: 'token-123' }));
    expect(state.accessToken).toBe('token-123');
    expect(state.isAuthenticated).toBe(true);
    expect(state.status).toBe('idle');
  });

  it('logout: сбрасывает токен и флаг авторизации', () => {
    const authenticated = authReducer(undefined, setCredentials({ accessToken: 'token-123' }));
    const state = authReducer(authenticated, logout());
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe('idle');
  });

  it('setChecking: устанавливает статус checking', () => {
    const state = authReducer(undefined, setChecking());
    expect(state.status).toBe('checking');
  });

  it('setCredentials сбрасывает статус checking в idle', () => {
    const checking = authReducer(undefined, setChecking());
    const state = authReducer(checking, setCredentials({ accessToken: 'token-abc' }));
    expect(state.status).toBe('idle');
  });

  it('logout сбрасывает статус checking в idle', () => {
    const checking = authReducer(undefined, setChecking());
    const state = authReducer(checking, logout());
    expect(state.status).toBe('idle');
  });
});
