import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import type { RootState } from '../store';

import baseQuery from './base-query';
import { logout, setCredentials } from './slices/auth-slice';

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError | null
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isAuthenticated = (api.getState() as RootState).auth.isAuthenticated;

    // if (!refreshToken) {
    //   api.dispatch(logout());
    //   return result;
    // }
    if (!isAuthenticated) {
      api.dispatch(logout());
      return result;
    }

    const refreshResult = await baseQuery({
      url: '/auth/refresh', // эндпоинт для обновления токена
      method: 'POST',
      credentials: 'include',
      // body: { refreshToken },
    }, api, extraOptions);

    if (refreshResult.data) {
      const { accessToken: newAccessToken  } = refreshResult.data as {
        accessToken: string;
        // refreshToken: string;
      };

      api.dispatch(setCredentials({
        accessToken: newAccessToken,
        // refreshToken: newRefreshToken,
      }));

      result = await baseQuery(args, api, extraOptions);
    } else {
      console.error('Failed to refresh accessToken:', refreshResult.error);
      api.dispatch(logout());
    }
  }

  return result;
};

export default baseQueryWithReauth;
