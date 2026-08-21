import { Label, Text, TextInput } from '@gravity-ui/uikit';
import { useMemo, useState, type KeyboardEvent } from 'react';

import type { TagResponse } from '../../store';

import style from './tags-input.module.css';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: TagResponse[];
  label?: string;
  disabled?: boolean;
}

const MAX_TAGS = 30;

/** Свободный ввод тегов: чипы + автодополнение по существующим тегам. */
export default function TagsInput({
  value,
  onChange,
  suggestions = [],
  label = 'Теги',
  disabled,
}: TagsInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (!name) return;

    const exists = value.some((t) => t.toLowerCase() === name.toLowerCase());
    if (exists || value.length >= MAX_TAGS) {
      setDraft('');
      return;
    }

    onChange([...value, name]);
    setDraft('');
  };

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === 'Backspace' && !draft && value.length) {
      removeTag(value[value.length - 1]);
    }
  };

  // Подсказки: существующие теги, ещё не выбранные, отфильтрованные по вводу.
  const filteredSuggestions = useMemo(() => {
    const selected = new Set(value.map((t) => t.toLowerCase()));
    const query = draft.trim().toLowerCase();
    return suggestions
      .filter((tag) => !selected.has(tag.name.toLowerCase()))
      .filter((tag) => !query || tag.name.toLowerCase().includes(query))
      .slice(0, 12);
  }, [suggestions, value, draft]);

  return (
    <div className={style.wrapper}>
      <span className={style.label}>{label}</span>

      {value.length > 0 && (
        <div className={style.chips}>
          {value.map((tag) => (
            <Label
              key={tag}
              theme="info"
              type="close"
              size="m"
              disabled={disabled}
              onCloseClick={() => removeTag(tag)}
            >
              {tag}
            </Label>
          ))}
        </div>
      )}

      <TextInput
        size="l"
        value={draft}
        disabled={disabled || value.length >= MAX_TAGS}
        placeholder="Введите тег и нажмите Enter"
        onUpdate={setDraft}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
      />

      {filteredSuggestions.length > 0 && (
        <div className={style.suggestions}>
          <Text className={style.suggestionsHint}>Существующие:</Text>
          {filteredSuggestions.map((tag) => (
            <Label
              key={tag.id}
              theme="normal"
              size="m"
              className={style.suggestion}
              onClick={() => addTag(tag.name)}
            >
              {tag.name}
              {typeof tag.count === 'number' ? ` (${tag.count})` : ''}
            </Label>
          ))}
        </div>
      )}
    </div>
  );
}
