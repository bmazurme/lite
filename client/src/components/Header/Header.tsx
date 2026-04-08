import { useNavigate } from 'react-router-dom';
import { Icon, Button } from '@gravity-ui/uikit';
import { Sun, Moon } from '@gravity-ui/icons';

import style from './Header.module.css';

const Header = ({ theme, setTheme }: { theme: string; setTheme: (theme: string) => void }) => {
  const navigate = useNavigate();

  return (
    <div className={style.header}>
      <Button
        view="outlined"
        size="l"
        onClick={() => navigate('/')}
      >
        Notes
      </Button>
      <Button
        view="outlined"
        size="l"
        onClick={() => navigate('/editor')}
      >
        Add
      </Button>
      <Button
        view="outlined"
        size="l"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Icon
          data={theme === 'dark' ? Sun : Moon}
          size={18}
        />
      </Button>
    </div>
  );
};

export default Header;
