import { describe, it, expect } from 'vitest';

import type { NoteResponse } from '..';

import notesReducer, { initialStateNotes, setNotes, setNote } from './notes-slice';

const mockNote: NoteResponse = {
  id: 1,
  title: 'Test Note',
  preview: 'Preview text',
  content: 'Full content',
  type: { id: 1, name: 'Article', color: '#4aa1f2' },
};

describe('notes-slice', () => {
  it('возвращает начальное состояние', () => {
    expect(notesReducer(undefined, { type: '@@init' })).toEqual(initialStateNotes);
  });

  it('setNotes: устанавливает список заметок', () => {
    const state = notesReducer(undefined, setNotes({ notes: [mockNote] }));
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].title).toBe('Test Note');
  });

  it('setNotes: заменяет предыдущий список', () => {
    const withNotes = notesReducer(undefined, setNotes({ notes: [mockNote] }));
    const anotherNote = { ...mockNote, id: 2, title: 'Another' };
    const state = notesReducer(withNotes, setNotes({ notes: [anotherNote] }));
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].id).toBe(2);
  });

  it('setNote: устанавливает одиночную заметку', () => {
    const state = notesReducer(undefined, setNote({ note: mockNote }));
    expect(state.note).toEqual(mockNote);
  });

  it('setNote: принимает null', () => {
    const withNote = notesReducer(undefined, setNote({ note: mockNote }));
    const state = notesReducer(withNote, setNote({ note: null }));
    expect(state.note).toBeNull();
  });
});
