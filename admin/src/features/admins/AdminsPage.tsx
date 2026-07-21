import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  listAdmins,
  createAdmin,
  setAdminDisabled,
  type AdminRow,
} from '../../api/adminManage';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function AdminsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listAdmins());
    } catch (e: any) {
      setError(e.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    setCreating(true);
    try {
      await createAdmin(email.trim(), password);
      setEmail('');
      setPassword('');
      await load();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(row: AdminRow) {
    setBusy(true);
    try {
      await setAdminDisabled(row.id, !row.disabled);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update admin');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="cms-main__title">Admins</h2>

      <form className="admin-inline-form" onSubmit={handleCreate}>
        <label className="admin-field">
          <span className="admin-field__label">Email</span>
          <input
            className="admin-field__input"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className="admin-field">
          <span className="admin-field__label">Password (min 8)</span>
          <input
            className="admin-field__input"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <button className="admin-btn admin-btn--primary" disabled={creating}>
          {creating ? 'Creating...' : 'Create admin'}
        </button>
      </form>
      {formError && <div className="admin-form__error">{formError}</div>}

      {loading ? (
        <p className="cms-main__hint">Loading...</p>
      ) : error ? (
        <div className="admin-form__error">{error}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id}>
                  <td>
                    {row.email}
                    {user?.id === row.id && <span className="admin-table__you"> (you)</span>}
                  </td>
                  <td>
                    <span className={`admin-pill ${row.disabled ? 'admin-pill--red' : 'admin-pill--green'}`}>
                      {row.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="admin-table__dim">{fmtDate(row.createdAt)}</td>
                  <td className="admin-table__actions">
                    {user?.id !== row.id && (
                      <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => handleToggle(row)}>
                        {row.disabled ? 'Enable' : 'Disable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
