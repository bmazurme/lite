import { Link as LinkIcon } from '@gravity-ui/icons';
import { Icon, Text } from '@gravity-ui/uikit';
import { Link } from 'react-router-dom';

import type { BacklinkRef } from '../../store/api/notes-api/endpoints';

interface RelatedNotesProps {
  notes?: BacklinkRef[];
}

/** Связанные заметки, выбранные автором вручную. Ничего не рендерит, если список пуст. */
export default function RelatedNotes({ notes }: RelatedNotesProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="related-notes">
      <Text
        variant="subheader-2"
        className="related-notes-title"
      >
        Связанные заметки
      </Text>
      <nav
        className="related-notes-list"
        aria-label="Связанные заметки"
      >
        {notes.map((note) => (
          <Link
            key={note.id}
            className="related-note-item"
            to={`/n/${note.slug}`}
          >
            <Icon
              data={LinkIcon}
              size={14}
              aria-hidden="true"
            />
            {note.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
