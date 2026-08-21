import { Button, Label } from '@gravity-ui/uikit';
import type { MouseEvent } from 'react';

import style from './tag.module.css';

interface TagBaseProps {
  name: string;
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

interface TagChipProps extends TagBaseProps {
  variant?: 'chip';
  onRemove?: () => void;
}

interface TagRowProps extends TagBaseProps {
  variant: 'row';
  count?: number;
}

type TagProps = TagChipProps | TagRowProps;

/** Единичный тег: компактный чип (карточка заметки, баннер фильтра) или строка списка (сайдбар). */
export default function Tag(props: TagProps) {
  const { name, active, onClick } = props;

  if (props.variant === 'row') {
    return (
      <Button
        view={active ? 'normal' : 'flat'}
        size="m"
        width="max"
        className={style.row}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
      >
        <span className={style.rowContent}>
          <span className={style.label}>
            <span className={style.hash}>#</span>
            <span className={style.name}>{name}</span>
          </span>
          {typeof props.count === 'number' && (
            <span className={style.count}>{props.count}</span>
          )}
        </span>
      </Button>
    );
  }

  const { onRemove } = props;

  return (
    <Label
      size="s"
      theme={active ? 'info' : 'clear'}
      className={style.chip}
      type={onRemove ? 'close' : 'default'}
      onClick={onClick}
      onCloseClick={onRemove}
      closeButtonLabel={`Убрать фильтр по тегу #${name}`}
    >
      <span className={style.hash}>#</span>
      {name}
    </Label>
  );
}
