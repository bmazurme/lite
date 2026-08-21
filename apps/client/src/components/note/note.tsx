import { CircleFill } from '@gravity-ui/icons';
import { Card, Icon, Label, Text } from '@gravity-ui/uikit';
import { Link, useNavigate } from 'react-router-dom';

import MarkdownPreview from '../markdown-preview/markdown-preview';
import Tag from '../tag/tag';

import { MARKDOWN_SETTINGS } from './markdown-settings';
import type { NoteProps } from './note.props';

export default function Note({ note }: NoteProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="blog-post"
      theme="normal"
      type="selection"
      size="l"
    >
      <div className="post-title">
        <Text variant="header-1">
          {/*
            Настоящая ссылка <a href="/n/:slug"> — краулится ботами и работает
            в новой вкладке. Класс post-link растягивает кликабельную зону на всю
            карточку (::after), сохраняя клиентскую навигацию через react-router.
          */}
          <Link
            className="post-link"
            to={`/n/${note.slug}`}
          >
            {note.title}
          </Link>
        </Text>
        <span style={{ '--type-color': note.type.color } as React.CSSProperties}>
          <Label
            size="s"
            className="type-label"
            icon={(
              <Icon
                data={CircleFill}
                size={10}
                aria-hidden="true"
                style={{ color: note.type.color }}
              />
            )}
          >
            {note.type.name}
          </Label>
        </span>
        {note.published === false && (
          <Label
            size="s"
            theme="warning"
          >
            Черновик
          </Label>
        )}
      </div>

      <div className="post-content">
        <MarkdownPreview
          getValue={() => note?.preview || ''}
          {...MARKDOWN_SETTINGS}
        />
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="post-tags">
          {note.tags.map((tag) => (
            <Tag
              key={tag.id}
              name={tag.name}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/notes/tag/${tag.slug}`);
              }}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
