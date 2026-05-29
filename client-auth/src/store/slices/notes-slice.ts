 import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '..';

export type NoteType = {
  id: number;
  title: string;
  preview: string;
  content: string;
  type: {
    id: number;
    name: string;
  };
}

type NotesState = {
  notes: NoteType [];
  note: NoteType | null;
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
