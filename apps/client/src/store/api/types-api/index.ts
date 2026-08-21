import { createApi, retry } from '@reduxjs/toolkit/query/react';

import baseQuery from '../../base-query-with-reauth';

export const baseQueryWithRetry = retry(baseQuery, { maxRetries: 0 });

const typesApi = createApi({
  reducerPath: 'typesApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Types'],
  endpoints: () => ({}),
});

export default typesApi;
