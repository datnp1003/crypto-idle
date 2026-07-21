import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  listPlayers,
  getPlayer,
  resetPlayerSave,
  setPlayerDisabled,
  type PlayerRow,
  type PlayerDetail,
} from '../../api/adminManage';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function PlayersPage() {
  const [items, setItems] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listPlayers());
    } catch (e: any) {
      setError(e.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      setDetail(await getPlayer(id));
    } catch (e: any) {
      setError(e.message || 'Failed to load player');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  async function handleView(id: number) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    await loadDetail(id);
  }

  async function handleReset(id: number) {
    if (!confirm('Reset this player’s save? This cannot be undone.')) return;
    setBusy(true);
    try {
      await resetPlayerSave(id);
      await Promise.all([load(), openId === id ? loadDetail(id) : Promise.resolve()]);
    } catch (e: any) {
      setError(e.message || 'Failed to reset save');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(row: PlayerRow) {
    setBusy(true);
    try {
      await setPlayerDisabled(row.id, !row.disabled);
      await Promise.all([load(), openId === row.id ? loadDetail(row.id) : Promise.resolve()]);
    } catch (e: any) {
      setError(e.message || 'Failed to update player');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <><h2 className="cms-main__title">Players</h2><p className="cms-main__hint">Loading...</p></>;

  return (
    <>
      <h2 className="cms-main__title">Players</h2>
      {error && <div className="admin-form__error">{error}</div>}
      {items.length === 0 ? (
        <p className="cms-main__hint">No players registered.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Save</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <Fragment key={row.id}>
                  <tr>
                    <td>{row.email}</td>
                    <td>
                      <span className={`admin-pill ${row.disabled ? 'admin-pill--red' : 'admin-pill--green'}`}>
                        {row.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${row.hasSave ? 'admin-pill--green' : 'admin-pill--muted'}`}>
                        {row.hasSave ? 'Has save' : 'None'}
                      </span>
                    </td>
                    <td className="admin-table__dim">{fmtDate(row.createdAt)}</td>
                    <td className="admin-table__actions">
                      <button className="admin-btn admin-btn--ghost" onClick={() => handleView(row.id)}>
                        {openId === row.id ? 'Hide' : 'View'}
                      </button>
                      <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => handleToggle(row)}>
                        {row.disabled ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                  </tr>
                  {openId === row.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="admin-detail">
                          {detailLoading || !detail ? (
                            <p className="cms-main__hint">Loading save...</p>
                          ) : (
                            <>
                              <div className="admin-detail__bar">
                                <span className="admin-detail__meta">
                                  Save updated: {detail.saveUpdatedAt ? fmtDate(detail.saveUpdatedAt) : '—'}
                                </span>
                                <button
                                  className="admin-btn admin-btn--danger"
                                  disabled={busy || detail.save === null}
                                  onClick={() => handleReset(row.id)}
                                >
                                  Reset Save
                                </button>
                              </div>
                              {detail.save === null ? (
                                <p className="cms-main__hint">No save.</p>
                              ) : (
                                <pre className="admin-json">{JSON.stringify(detail.save, null, 2)}</pre>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
