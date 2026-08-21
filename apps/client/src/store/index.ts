import { configureStore } from '@reduxjs/toolkit';

import { authApi, usersApi, notesApi, typesApi, tagsApi } from './api/index';
import authReducer from './slices/auth-slice';
import notesReducer from './slices/notes-slice';
import tagsReducer from './slices/tags-slice';
import themeReducer from './slices/theme-slice';
import typesReducer from './slices/types-slice';
import usersReducer from './slices/users-slice';

export * from './api/auth-api/endpoints/index';
export * from './api/users-api/endpoints/index';
export * from './api/notes-api/endpoints/index';
export * from './api/types-api/endpoints/index';
export * from './api/tags-api/endpoints/index';

export * from './slices/index';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    theme: themeReducer,
    notes: notesReducer,
    types: typesReducer,
    tags: tagsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [notesApi.reducerPath]: notesApi.reducer,
    [typesApi.reducerPath]: typesApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
    .concat(
      authApi.middleware,
      usersApi.middleware,
      notesApi.middleware,
      typesApi.middleware,
      tagsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
