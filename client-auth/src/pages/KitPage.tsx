import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '@gravity-ui/uikit';
import { Moon, Sun } from '@gravity-ui/icons';
import { useToaster } from '@gravity-ui/uikit';

import BrokenComponent from '../components/BrokenComponent';
import { useAppDispatch } from '../hooks';
import { useTheme } from '../hooks/use-theme';
import { setTheme } from '../store';
// import { toaster } from '../main';

function KitPage() {
  const { add } = useToaster();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const toggleTheme = (value: boolean) => dispatch(setTheme({ isDark: value }));
  const addToast = () => add({
    title: 'Title',
    content: 'text',
    theme: 'warning',
    name: 'any-toast'
  });
  
  return (
    <>
      <section id="center">
        <div>
          <Button
            view="normal"
            size="m"
            pin="round-clear"
            selected={!isDark}
            aria-label="Светлая тема"
            onClick={() => toggleTheme(false)}
          >
            <Icon data={Sun} size={16} />
          </Button>
          <Button
            view="normal"
            size="m"
            pin="clear-round"
            selected={isDark}
            aria-label="Темная тема"
            onClick={() => toggleTheme(true)}
          >
            <Icon data={Moon} size={16} />
          </Button>
        </div>

        <Button
          view="outlined-action"
          size="m"
          onClick={() => navigate('/')}
        >
          To Main
        </Button>
        <Button
          view="outlined-action"
          size="m"
          onClick={() => toggleTheme(!isDark)}
        >
          Toggle theme
        </Button>
        <Button
          view="outlined-action"
          size="m"
          onClick={addToast}
        >
          Add tost
        </Button>
        <BrokenComponent />
      </section>
    </>
  )
}

export default KitPage;
