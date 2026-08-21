 import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';

type UserType = {
  id: number;
  email: string;
}

type UsersState = {
  data: UserType | null;
};

export const initialStateUsers: UsersState = {
  data: null,
};

const slice = createSlice({
  name: 'users',
  initialState: initialStateUsers,
  reducers: {
  },
});

export default slice.reducer;
export const usersSelector = (state: RootState) => state.users.data;
