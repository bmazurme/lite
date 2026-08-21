import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useIsAuthenticated } from '../../hooks/use-is-authenticated';
import { renderWithProviders } from '../../test/utils';

import ProtectedWrapper from './protected-wrapper';

vi.mock('../../hooks/use-is-authenticated', () => ({
  useIsAuthenticated: vi.fn(),
}));

const mockUseIsAuthenticated = vi.mocked(useIsAuthenticated);

describe('ProtectedWrapper', () => {
  it('показывает children когда пользователь авторизован', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: true, isChecking: false });

    renderWithProviders(
      <ProtectedWrapper>
        <span>Protected content</span>
      </ProtectedWrapper>
    );

    expect(screen.getByText('Protected content')).toBeVisible();
  });

  it('показывает fallback когда пользователь не авторизован', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: false, isChecking: false });

    renderWithProviders(
      <ProtectedWrapper fallback={<span>Login please</span>}>
        <span>Protected content</span>
      </ProtectedWrapper>
    );

    expect(screen.getByText('Login please')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('рендерит children скрытыми во время проверки авторизации', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: false, isChecking: true });

    renderWithProviders(
      <ProtectedWrapper>
        <span>Protected content</span>
      </ProtectedWrapper>
    );

    const content = screen.getByText('Protected content');
    expect(content).toBeInTheDocument();
    expect(content.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('показывает null по умолчанию если fallback не передан', () => {
    mockUseIsAuthenticated.mockReturnValue({ isAuthenticated: false, isChecking: false });

    const { container } = renderWithProviders(
      <ProtectedWrapper>
        <span>Protected content</span>
      </ProtectedWrapper>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
