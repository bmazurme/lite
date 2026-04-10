import { useParams } from 'react-router-dom';

import Note from '../../components/Note/Note';
import Layout from '../../components/Layout/Layout';

import style from './NotePage.module.css';

const NotePage = ({ setTheme, theme, title, value, labels }
  : { setTheme: React.Dispatch<React.SetStateAction<string>>, theme: string, title: string, value: string, labels: string[] }) => {
  const { noteId } = useParams();
  console.log(noteId);

  return (
    <Layout
      setTheme={setTheme}
      theme={theme}
    >
      <div className={style.container}>
        {/* {noteId} */}
        <Note
          title={title}
          value={value}
          labels={labels}
        />
      </div>
    </Layout>
  );
};

export default NotePage;
