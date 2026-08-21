import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'checking';
}

export const initialStateAuth: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialStateAuth,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.status = 'idle';
    },
    logout: (state) => {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.status = 'idle';
    },
    setChecking: (state) => {
      state.status = 'checking';
    },
  },
});

export const { setCredentials, logout, setChecking } = authSlice.actions;
export default authSlice.reducer;
export const authSelector = (state: RootState) => state.auth;
