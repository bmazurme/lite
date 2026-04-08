
import { useNavigate } from 'react-router-dom';

import type { MarkupString } from '@gravity-ui/markdown-editor';

import Layout from '../../Layout';
import Form from '../../components/Form/Form';

import style from './EditorPage.module.css';

const EditorPage = ({ setTheme, theme, setTitle, title, handleSubmit }
  : {
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    handleSubmit: (value: MarkupString) => void;
    title: string;
    theme: string;
  }) => {
    const navigate = useNavigate();

  return (
    <Layout setTheme={setTheme} theme={theme}>
      <div className={style.container}>

        <Form
          title={title}
          setTitle={setTitle}
          handleSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
};

export default EditorPage;
