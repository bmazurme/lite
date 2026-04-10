import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@gravity-ui/uikit';

import Layout from '../../components/Layout/Layout';

import style from './NotFoundPage.module.css';

const NotFoundPage = ({ setTheme, theme }: { setTheme: React.Dispatch<React.SetStateAction<string>>; theme: string; }) => {
  const navigate = useNavigate();

  return (
    <Layout setTheme={setTheme} theme={theme}>
      <div className={style.container}>
        <Text
          variant="header-2"
          className={style.link}
          onClick={() => navigate('/note')}
        >
          404
        </Text>
        <Text
          variant="header-1"
          className={style.link}
          onClick={() => navigate('/note')}
        >
          Non found page
        </Text>
      <Button
        view="action"
        size="l"
        onClick={() => navigate('/')}
      >
        Home
      </Button>

      </div>
    </Layout>
  );
};

export default NotFoundPage;
