import { Label, Text, TextInput } from '@gravity-ui/uikit';
import { useEffect, useMemo, useState } from 'react';

import { useSearchNotesMutation, type BacklinkRef } from '../../store';
import style from '../tags-input/tags-input.module.css';

interface RelatedNotesInputProps {
  value: number[];
  onChange: (ids: number[]) => void;
  initialSelected?: BacklinkRef[];
  excludeId?: number;
  disabled?: boolean;
}

const MAX_RELATED = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Ручной выбор связанных заметок: чипы + поиск по существующим заметкам. */
export default function RelatedNotesInput({
  value,
  onChange,
  initialSelected = [],
  excludeId,
  disabled,
}: RelatedNotesInputProps) {
  const [titlesById] = useState(() => new Map(initialSelected.map((note) => [note.id, note.title])));
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState<BacklinkRef[]>([]);
  const [searchNotes] = useSearchNotesMutation();

  useEffect(() => {
    const q = draft.trim();
    if (!q) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await searchNotes({ q, page: 1 }).unwrap();
        setSuggestions(data);
      } catch {
        // Подсказки необязательны — молча игнорируем ошибку.
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, searchNotes]);

  const addNote = (note: BacklinkRef) => {
    if (value.includes(note.id) || note.id === excludeId || value.length >= MAX_RELATED) return;

    titlesById.set(note.id, note.title);
    onChange([...value, note.id]);
    setDraft('');
  };

  const removeNote = (id: number) => {
    onChange(value.filter((noteId) => noteId !== id));
  };

  const filteredSuggestions = useMemo(() => {
    if (!draft.trim()) return [];
    return suggestions
      .filter((note) => !value.includes(note.id) && note.id !== excludeId)
      .slice(0, 12);
  }, [suggestions, value, excludeId, draft]);

  return (
    <div className={style.wrapper}>
      <span className={style.label}>Связанные заметки</span>

      {value.length > 0 && (
        <div className={style.chips}>
          {value.map((id) => (
            <Label
              key={id}
              theme="info"
              type="close"
              size="m"
              disabled={disabled}
              onCloseClick={() => removeNote(id)}
            >
              {titlesById.get(id) ?? `#${id}`}
            </Label>
          ))}
        </div>
      )}

      <TextInput
        size="l"
        value={draft}
        disabled={disabled || value.length >= MAX_RELATED}
        placeholder="Начните вводить название заметки"
        onUpdate={setDraft}
      />

      {filteredSuggestions.length > 0 && (
        <div className={style.suggestions}>
          <Text className={style.suggestionsHint}>Найдено:</Text>
          {filteredSuggestions.map((note) => (
            <Label
              key={note.id}
              theme="normal"
              size="m"
              className={style.suggestion}
              onClick={() => addNote(note)}
            >
              {note.title}
            </Label>
          ))}
        </div>
      )}
    </div>
  );
}
