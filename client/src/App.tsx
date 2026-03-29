import { ThemeProvider, Toaster, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit';
import type { MarkupString } from '@gravity-ui/markdown-editor';

import { Editor } from './Editor';
import MarkdownPreview from './MarkdownPreview';
import { useState } from 'react';

import { Button, TextInput, Card } from '@gravity-ui/uikit';

const App: React.FC = () => {
  const [value, setValue] = useState('');
  const toaster = new Toaster();
  const handleSubmit = (value: MarkupString) => {
    console.log('Отправленное значение:', value);
    setValue(value);
  };

  return (
    <ThemeProvider theme="dark">
      <ToasterProvider toaster={toaster}>
        <ToasterComponent />

        <TextInput placeholder="Title" size="l" />
        <TextInput placeholder="Placeholder" size="l" />

        <Editor onSubmit={handleSubmit} />
        <Button view="outlined" size="l">
          Save
          </Button>

        <Card theme="normal" size="l">
          <MarkdownPreview
            getValue={() => value}
            allowHTML={false}
            breaks={true}
            linkify={true}
          />
        </Card>

      </ToasterProvider>
    </ThemeProvider>
  );
};

export default App;
