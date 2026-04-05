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
      <Text variant="header-1">
        some text
      </Text>
      <MarkdownPreview
        getValue={() => value}
        allowHTML={true}
        breaks={true}
        linkify={true}
      />
      <Label theme="clear">Clear</Label>
      <Label theme="clear">Clear</Label>
      <Label theme="clear">Clear</Label>
    </Card>
  );
};

export default Note;
