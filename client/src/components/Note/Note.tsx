import { Card, Text, Label, Skeleton } from '@gravity-ui/uikit';
import MarkdownPreview from '../MarkdownPreview/MarkdownPreview';

import style from './Note.module.css';

const Note = ({ title, value, labels }
  : { title: string; value: string; labels: string[] }) => {
  return (
    <Card
      theme="normal"
      size="l"
      className={style.preview}
    >
      {title
      ? <Text
          variant="header-2"
          className={style.title}
        >
          {title}
        </Text>
      : <Skeleton className={style.loading_title} />}

      <div className={style.markdown}>
        {value
        ?
        <MarkdownPreview
          getValue={() => value}
          allowHTML={true}
          breaks={true}
          linkify={true}
        />
        : <Skeleton className={style.loading_body} />}
      </div>

      <div className={style.labels}>
        {labels.length > 0
          ? labels.map((label) => (
            <Label
              key={label}
              theme="clear"
            >
              {label}
            </Label>
          ))
          : (<Skeleton className={style.loading_labels} />)}
      </div>

    </Card>
  );
};

export default Note;
