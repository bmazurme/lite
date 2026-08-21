import { createApi, retry } from '@reduxjs/toolkit/query/react';

import baseQuery from '../../base-query-with-reauth';

export const baseQueryWithRetry = retry(baseQuery, { maxRetries: 0 });

const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Users'],
  endpoints: () => ({}),
});

export default usersApi;
