import { configureStore } from '@reduxjs/toolkit';

import { authApi, usersApi, notesApi } from './api/index';

import authReducer from './slices/auth-slice';
import usersReducer from './slices/users-slice';
import themeReducer from './slices/theme-slice';
import notesReducer from './slices/notes-slice';

export * from './api/auth-api/endpoints/index';
export * from './api/users-api/endpoints/index';
export * from './api/notes-api/endpoints/index';

export * from './slices/index';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    theme: themeReducer,
    notes: notesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [notesApi.reducerPath]: notesApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
    .concat(
      authApi.middleware,
      usersApi.middleware,
      notesApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
