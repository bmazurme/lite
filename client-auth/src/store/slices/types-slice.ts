import { createSlice } from '@reduxjs/toolkit';

import type { RootState, Type } from '..';

type TypesState = {
  types: Type[];
};

export const initialStateTypes: TypesState = {
  types: [],
};

const typesSlice = createSlice({
  name: 'types',
  initialState: initialStateTypes,
  reducers: {
    setTypes: (state, action) => {
      state.types = action.payload;
    },
  },
});

export const { setTypes } = typesSlice.actions;
export default typesSlice.reducer;
export const typesSelector = (state: RootState) => state.types.types;
