import { useEffect, useState } from 'react';
import { getGameConfig, type GameConfigResponse } from '../../api/gameConfig';

export function DashboardPage() {
  const [config, setConfig] = useState<GameConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGameConfig()
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const staffCount = config?.staff.length ?? 0;
  const upgradeCount = config?.upgrades.length ?? 0;
  const settingsCount = config?.settings ? Object.keys(config.settings).length : 0;
  const apiStatus = error ? 'Offline' : config ? 'Connected' : 'Connecting…';
  const apiDot = error ? 'red' : config ? 'green' : 'gold';

  const cards = [
    { label: 'Staff', value: loading ? 'Loading…' : `${staffCount} modules`, dot: 'blue' as const },
    { label: 'Upgrades', value: loading ? 'Loading…' : `${upgradeCount} upgrades`, dot: 'gold' as const },
    { label: 'Settings', value: loading ? 'Loading…' : `${settingsCount} settings`, dot: 'purple' as const },
    { label: 'API', value: loading ? 'Connecting…' : `${apiStatus}${error ? ` (${error})` : ''}`, dot: apiDot as 'green' | 'red' | 'gold' },
  ];

  return (
    <>
      <h2 className="cms-main__title">Dashboard</h2>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <article key={card.label} className="dashboard-card">
            <span className="dashboard-card__label">{card.label}</span>
            <span className="dashboard-card__value">
              <span className={`dashboard-card__dot dashboard-card__dot--${card.dot}`} />
              {card.value}
            </span>
          </article>
        ))}
      </div>

      <p className="cms-main__hint">
        {error
          ? <><span className="cms-hint--warn">Backend offline.</span> Start NestJS on port 3025 to see live data.</>
          : config
            ? <>Next: auth + admin CRUD</>
            : <>Connecting to <code>/api/config</code>…</>
        }
      </p>
    </>
  );
}
