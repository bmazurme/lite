import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Pagination, Text,
  type PaginationProps, 
} from '@gravity-ui/uikit';

import Layout from '../../components/Layout/Layout';

import style from './MainPage.module.css';

const links = [{ id: 0, tag: 1 }, { id: 1, tag: 2 }, { id: 2, tag: 3 }];

const MainPage = ({ setTheme, theme, page: forcedPage }: { setTheme: React.Dispatch<React.SetStateAction<string>>; theme: string; page?: number }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  // console.log(pageFromUrl, forcedPage);
  const currentPage = forcedPage !== undefined ? forcedPage : pageFromUrl;
  // console.log(currentPage);
  const [state, setState] = useState({ page: currentPage, pageSize: 100 });
  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) => {
    console.log(page, pageSize);
    if (page === 1) {
      // Переход на главную страницу
      window.location.href = '/';
    } else {
      navigate(`/notes?page=${page}`);
      // const newParams = new URLSearchParams(searchParams);
      // newParams.set('page', page.toString());
      // setSearchParams(newParams);
    }
    setState((prevState) => ({ ...prevState, page, pageSize }));
  }

  // const handleChange = (name: string, value: string) => {
  //   setSearchParams({
  //     ...Object.fromEntries(searchParams),
  //     [name]: value,
  //   });
  // };



  // useEffect(() => {
  //   handleChange('page', `${state.page}`);
  //   // fetchData(+state.page);
  // }, [state.page]);
  // useEffect(() => {
  //   console.log(state.page);

  //   if (state.page === 1 && location.pathname === '/notes') {
  //     setSearchParams({}, { replace: true }); // Убираем ?page=0 из URL
  //   }
  // }, [state.page, location.pathname, setSearchParams]);

  // const changePage = (newPage) => {
  //   // if (newPage === 0) {
  //   //   // Переход на главную страницу
  //   //   window.location.href = '/';
  //   // } else {
  //   //   const newParams = new URLSearchParams(searchParams);
  //   //   newParams.set('page', newPage.toString());
  //   //   setSearchParams(newParams);
  //   // }
  // };

  return (
    <Layout setTheme={setTheme} theme={theme}>
      <div className={style.container}>
        {links.map((link) => (
        <Text
          key={link.id}
          variant="header-1"
          className={style.link}
          onClick={() => navigate(`/note/${link.id}`)}
        >
          {`Link ${link.id}`}
        </Text>
        ))}


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
