import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setPending(false);
    }
  }

  async function handleRegister() {
    setError(null);
    setPending(true);
    try {
      await register(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setPending(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-card__title">Crypto Idle CMS</h1>
        <p className="login-card__subtitle">Sign in to the admin console</p>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-form__field">
            <span className="login-form__label">Email</span>
            <input
              className="login-form__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="login-form__field">
            <span className="login-form__label">Password</span>
            <input
              className="login-form__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="login-form__error">{error}</div>}

          <button className="login-form__submit" type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-card__divider">
          <span>or</span>
        </div>

        <button
          className="login-form__register"
          type="button"
          disabled={pending}
          onClick={handleRegister}
        >
          Create first admin
        </button>

        <p className="login-card__hint">
          First account registered becomes admin.
        </p>
      </div>
    </div>
  );
}
