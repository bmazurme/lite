import { useCallback } from 'react';
import { Button } from '@gravity-ui/uikit';

import { useGetUserInfoMutation } from '../store/api/users-api/endpoints';

import ProtectedWrapper from '../components/ProtectedWrapper';
import RedirectToLogin from '../components/RedirectToLogin';

function ProtectedPage() {
  const [getUserInfo] = useGetUserInfoMutation();

  const handleGetUserInfo = useCallback(async () => {
    try {
      const response = await getUserInfo().unwrap();
      console.log('User info:', response);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }, [getUserInfo]);

  return (
    <>
      <section id="center">
        <ProtectedWrapper fallback={<RedirectToLogin />}>
          <Button
            view="outlined-action"
            size="m"
            onClick={handleGetUserInfo}
          >
            Get info
          </Button>
        </ProtectedWrapper>
      </section>
    </>
  )
}

export default ProtectedPage;
