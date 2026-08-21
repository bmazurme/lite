import { Button } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '../../hooks';
import { toaster } from '../../main';
import { logout } from '../../store';
import { useLogoutMutation } from '../../store/api/auth-api/endpoints';
import ProtectedWrapper from '../protected-wrapper';

export default function HeaderMenu() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logoutAuth] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutAuth().unwrap();
      dispatch(logout());
    } catch {
      toaster.add({
        name: 'logout-error',
        title: 'Не удалось выйти',
        theme: 'danger',
      });
    }
  };

  return (
    <div className="header-menu">
      <ProtectedWrapper
        fallback={
          <Button
            view="flat"
            size="m"
            onClick={() => navigate('/oauth')}
          >
            Login
          </Button>
        }
      >
        <>
          <Button
            view="flat"
            size="m"
            onClick={() => navigate('/profile')}
          >
            Profile
          </Button>
          <Button
            view="outlined-utility"
            size="m"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </>
      </ProtectedWrapper>
    </div>
  );
}
