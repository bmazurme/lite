import { createApi, retry } from '@reduxjs/toolkit/query/react';

import baseQuery from '../../base-query-with-reauth';

export const baseQueryWithRetry = retry(baseQuery, { maxRetries: 0 });

const tagsApi = createApi({
  reducerPath: 'tagsApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Tags'],
  endpoints: () => ({}),
});

export default tagsApi;
