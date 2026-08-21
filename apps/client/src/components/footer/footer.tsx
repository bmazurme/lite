import { Link } from '@gravity-ui/uikit';

export default function Footer() {
  return (
    <footer className="blog-footer">
      &copy; 2026 — {' '}
      <Link
        className="blog-footer__link"
        href="https://ntlstl.dev/"
        target="_blank"
        view="secondary"
      >
        ntlstl.dev
      </Link>
      <Link
        className="blog-footer__link"
        href="https://github.com/bmazurme"
        target="_blank"
        view="secondary"
      >
        GitHub
      </Link>
    </footer>
  );
}
