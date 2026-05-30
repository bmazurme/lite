import { TextInput } from '@gravity-ui/uikit';

import { Editor } from '../Editor/Editor';

import style from './Form.module.css';


const Form = ({ title, setTitle, handleSubmit }: {
  title: string;
  setTitle: (title: string) => void;
  handleSubmit: (preview: string, content: string) => void;
}) => {
  return (
    <div className={style.form}>
      <TextInput
        placeholder="Title"
        size="l"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextInput
        placeholder="Tag"
        size="l"
      />
      <Editor onSubmit={handleSubmit} />
    </div>
  );
};

export default Form;
