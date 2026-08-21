import { createApi, retry } from '@reduxjs/toolkit/query/react';

import baseQuery from '../../base-query-with-reauth';

export const baseQueryWithRetry = retry(baseQuery, { maxRetries: 0 });

const notesApi = createApi({
  reducerPath: 'notesApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Notes'],
  endpoints: () => ({}),
});

export default notesApi;
