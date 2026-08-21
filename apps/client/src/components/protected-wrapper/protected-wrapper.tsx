import { useIsAuthenticated } from '../../hooks/use-is-authenticated';

import style from './protected-wrapper.module.css';

const ProtectedWrapper = ({
  children,
  requiredRoles = [],
  fallback = null,
  anyRole = false,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  anyRole?: boolean;
}) => {
  const { isAuthenticated, isChecking } = useIsAuthenticated();
  const userRoles: string[] = [];

  if (isChecking) {
    return (
      <span className={style.hidden} aria-hidden="true">
        {children}
      </span>
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  const hasRequiredRole = anyRole
    ? requiredRoles.some((role) => userRoles.includes(role))
    : requiredRoles.every((role) => userRoles.includes(role));

  return hasRequiredRole ? <>{children}</> : fallback;
};

export default ProtectedWrapper;
