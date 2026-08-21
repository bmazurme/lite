import { fetchBaseQuery } from '@reduxjs/toolkit/query';

import type { RootState } from '../store';
import { BASE_PROJECT_API_URL } from '../utils/constants';

// Create our baseQuery instance
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_PROJECT_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return headers;
  },
  // prepareHeaders: (headers) => headers,
  credentials: 'include',
});

export default baseQuery;
