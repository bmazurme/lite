import { Button } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';

import HeaderMenu from '../header-menu';
import Navbar from '../navbar';
import ThemeButton from '../theme-button';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="blog-header">
      <div className="header-container">
        <div className="header-brand">
          <Button
            view="flat"
            size="l"
            className="header-logo-button"
            aria-label="NTLSTL — перейти на главную"
            onClick={() => navigate('/')}
          >
            <span className="header-logo">N</span>
          </Button>
          <span className="header-brand-text">
            <span className="header-brand-title">NTLST</span>
            <span className="header-brand-subtitle">Developer notes</span>
          </span>
          <Navbar />
        </div>
        <div className="header-actions">
          <HeaderMenu />
          <ThemeButton />
        </div>
      </div>
    </header>
  );
}
