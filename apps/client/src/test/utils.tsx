import { configureStore, type ReducersMapObject } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import type { RootState } from '../store';
import authReducer from '../store/slices/auth-slice';
import notesReducer from '../store/slices/notes-slice';
import themeReducer from '../store/slices/theme-slice';
import typesReducer from '../store/slices/types-slice';

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore<RootState>({
    reducer: {
      auth: authReducer,
      theme: themeReducer,
      notes: notesReducer,
      types: typesReducer,
    } as ReducersMapObject<RootState>,
    preloadedState,
  });
}

interface WrapperProps {
  children: ReactNode;
  preloadedState?: Partial<RootState>;
  initialRoute?: string;
}

function Wrapper({ children, preloadedState, initialRoute = '/' }: WrapperProps) {
  const store = createTestStore(preloadedState);
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </Provider>
  );
}

export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'> & { preloadedState?: Partial<RootState>; initialRoute?: string }
) {
  const { preloadedState, initialRoute, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper
        preloadedState={preloadedState}
        initialRoute={initialRoute}
      >
        {children}
      </Wrapper>
    ),
    ...renderOptions,
  });
}
