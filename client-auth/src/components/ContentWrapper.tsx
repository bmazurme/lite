import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { useAppDispatch } from '../hooks';
import { useCheckAuthQuery } from '../store/api/auth-api/endpoints';
import { setCredentials, logout, setChecking } from '../store/slices/auth-slice';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface ContentWrapperProps extends PropsWithChildren {
  sidebar?: boolean;
}

export default function ContentWrapper({ children, sidebar }: ContentWrapperProps) {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useCheckAuthQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch(setChecking());
    } else if (error) {
      dispatch(logout());
    } else if (data?.isAuthenticated) {
      if (data.accessToken) {
        dispatch(setCredentials({ accessToken: data.accessToken, isAuthenticated: true }));
      }
    } else {
      dispatch(logout());
    }
  }, [data, isLoading, dispatch, error]);

  return (
    <div className="container">
      <Header />
      <div className="blog-main">
        {children}
        {sidebar && <Sidebar />}
      </div>
      <Footer />
    </div>
  );
}
