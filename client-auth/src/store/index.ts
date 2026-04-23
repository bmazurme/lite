import { configureStore } from '@reduxjs/toolkit';

import { authApi, usersApi } from './api/index';

import authReducer from './slices/auth-slice';
import usersReducer from './slices/users-slice';
import themeReducer from './slices/theme-slice';

export * from './api/auth-api/endpoints/index';
export * from './api/users-api/endpoints/index';

export * from './slices/index';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    theme: themeReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
    .concat(
      authApi.middleware,
      usersApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
