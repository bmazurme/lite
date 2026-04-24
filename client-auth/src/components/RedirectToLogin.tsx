import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectToLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      Перенаправление на страницу входа...
    </div>
  );
};

export default RedirectToLogin;
