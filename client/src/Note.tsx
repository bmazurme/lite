import { Card, Text, Label } from '@gravity-ui/uikit';
import MarkdownPreview from './MarkdownPreview';

import style from './Note.module.css';

const Note = ({ value }: { value: string }) => {
  return (
    <Card
      theme="normal"
      size="l"
      className={style.preview}
    >
      <Text
        variant="header-2"
        className={style.title}
      >
        some text
      </Text>

      <div className={style.markdown}>
        <MarkdownPreview
          getValue={() => value}
          allowHTML={true}
          breaks={true}
          linkify={true}
        />
      </div>

      <div className={style.labels}>
        <Label theme="clear">Clear</Label>
        <Label theme="clear">Clear</Label>
        <Label theme="clear">Clear</Label>
      </div>

    </Card>
  );
};

export default Note;
