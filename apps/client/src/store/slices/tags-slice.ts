import { createSlice } from '@reduxjs/toolkit';

import type { RootState, TagResponse } from '..';

type TagsState = {
  tags: TagResponse[];
};

export const initialStateTags: TagsState = {
  tags: [],
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState: initialStateTags,
  reducers: {
    setTags: (state, action) => {
      state.tags = action.payload;
    },
  },
});

export const { setTags } = tagsSlice.actions;
export default tagsSlice.reducer;
export const tagsSelector = (state: RootState) => state.tags.tags;
