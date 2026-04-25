import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Pagination,
  type PaginationProps, 
} from '@gravity-ui/uikit';
import Post from './Post';

function Posts({ page: forcedPage }: { page?: number }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = forcedPage !== undefined ? forcedPage : pageFromUrl;
  const [state, setState] = useState({ page: currentPage, pageSize: 100 });
  const handleUpdate: PaginationProps['onUpdate'] = (page, pageSize) => {
    console.log(page, pageSize, setSearchParams);

    if (page === 1) {
      navigate('/');
    } else {
      navigate(`/notes?page=${page}`);
    }

    setState((prevState) => ({ ...prevState, page, pageSize }));
  }
  return (
    <section className="posts">
      <Post />
      <Post />

      <Pagination
        page={state.page}
        pageSize={state.pageSize}
        total={10000}
        onUpdate={handleUpdate}
      />
    </section>
  )
}

export default Posts;
