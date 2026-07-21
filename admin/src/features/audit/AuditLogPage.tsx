import { useEffect, useState, useCallback } from 'react';
import { listAudit, type AuditItem } from '../../api/adminManage';

const PAGE = 50;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function fmtDetails(json: string | null): string {
  if (!json) return '—';
  try {
    const obj = JSON.parse(json);
    return Object.entries(obj)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(', ') || '—';
  } catch {
    return json;
  }
}

export function AuditLogPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    setLoading(true);
    setError('');
    try {
      const page = await listAudit(PAGE, offset);
      setTotal(page.total);
      setItems(prev => (append ? [...prev, ...page.items] : page.items));
    } catch (e: any) {
      setError(e.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(0, false); }, [loadPage]);

  const hasMore = items.length < total;

  return (
    <>
      <h2 className="cms-main__title">Audit Log</h2>
      {error && <div className="admin-form__error">{error}</div>}
      {!loading && items.length === 0 ? (
        <p className="cms-main__hint">No audit entries.</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id}>
                    <td className="admin-table__dim">{fmtDate(row.createdAt)}</td>
                    <td>{row.actorEmail || row.actorUserId || '—'}</td>
                    <td>{row.action}</td>
                    <td className="admin-table__dim">
                      {row.targetType ? `${row.targetType}${row.targetId ? `:${row.targetId}` : ''}` : '—'}
                    </td>
                    <td className="admin-table__dim">{fmtDetails(row.detailsJson)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail__bar">
            <span className="admin-detail__meta">
              Showing {items.length} of {total}
            </span>
            {hasMore && (
              <button
                className="admin-btn admin-btn--ghost"
                disabled={loading}
                onClick={() => loadPage(items.length, true)}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
