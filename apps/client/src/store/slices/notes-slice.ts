import { createSlice } from '@reduxjs/toolkit';

import type { NoteResponse, RootState } from '..';

type NotesState = {
  notes: NoteResponse[];
  note: NoteResponse | null;
};

export const initialStateNotes: NotesState = {
  notes: [],
  note: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState: initialStateNotes,
  reducers: {
    setNotes: (state, action) => {
      state.notes = action.payload.notes;
    },
    setNote: (state, action) => {
      state.note = action.payload.note;
    },
  },
});

export const { setNotes, setNote } = notesSlice.actions;
export default notesSlice.reducer;
export const notesSelector = (state: RootState) => state.notes.notes;
export const noteSelector = (state: RootState) => state.notes.note;
