import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pagination, Text,
  type PaginationProps, 
} from '@gravity-ui/uikit';

import Layout from '../../components/Layout/Layout';

import style from './MainPage.module.css';

const MainPage = ({ setTheme, theme }: { setTheme: React.Dispatch<React.SetStateAction<string>>; theme: string; }) => {
  const navigate = useNavigate();
  const [state, setState] = useState({ page: 1, pageSize: 100 });
  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) =>
    setState((prevState) => ({ ...prevState, page, pageSize }));

  return (
    <Layout setTheme={setTheme} theme={theme}>
      <div className={style.container}>
        <Text
          variant="header-1"
          className={style.link}
          onClick={() => navigate('/note')}
        >
          Link
        </Text>
        <Text
          variant="header-1"
          className={style.link}
          onClick={() => navigate('/note')}
        >
          Link
        </Text>
        <Text
          variant="header-1"
          className={style.link}
          onClick={() => navigate('/note')}
        >
          Link
        </Text>

        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          total={10000}
          onUpdate={handleUpdate}
        />
      </div>
    </Layout>
  );
};

export default MainPage;
