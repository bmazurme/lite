import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { NoteResponse } from '../../store';
import { renderWithProviders } from '../../test/utils';

import Note from './note';

vi.mock('../markdown-preview/markdown-preview', () => ({
  default: ({ getValue }: { getValue: () => string }) => <div>{getValue()}</div>,
}));

const mockNote: NoteResponse = {
  id: 42,
  slug: 'testovaya-zametka',
  title: 'Тестовая заметка',
  preview: 'Краткое описание',
  content: 'Полный текст',
  type: { id: 1, name: 'Article', color: '#4aa1f2' },
};

describe('Note', () => {
  it('отображает заголовок заметки', () => {
    renderWithProviders(<Note note={mockNote} />);
    expect(screen.getByText('Тестовая заметка')).toBeInTheDocument();
  });

  it('отображает тип заметки', () => {
    renderWithProviders(<Note note={mockNote} />);
    expect(screen.getByText('Article')).toBeInTheDocument();
  });

  it('рендерит настоящую ссылку <a href="/n/:slug"> на каноническую заметку', () => {
    renderWithProviders(<Note note={mockNote} />);
    const link = screen.getByRole('link', { name: 'Тестовая заметка' });
    expect(link).toHaveAttribute('href', '/n/testovaya-zametka');
  });
});
