import { useNavigate } from 'react-router-dom';

import Note from '../../components/Note/Note';
import Layout from '../../Layout';

import style from './NotePage.module.css';


const NotePage = ({ setTheme, theme, title, value, labels }
  : { setTheme: React.Dispatch<React.SetStateAction<string>>, theme: string, title: string, value: string, labels: string[] }) => {
  const navigate = useNavigate();

  return (
    <Layout setTheme={setTheme} theme={theme}>
      <div className={style.container}>
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
