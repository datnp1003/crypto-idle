import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-card__subtitle">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
