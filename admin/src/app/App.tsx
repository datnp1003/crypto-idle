const navItems = [
  { label: 'Dashboard', active: true },
  { label: 'Staff' },
  { label: 'Upgrades' },
  { label: 'Settings' },
  { label: 'Players' },
  { label: 'Audit' },
];

const cards = [
  { label: 'Backend', value: 'NestJS ready', dot: 'green' as const },
  { label: 'CMS', value: 'React admin shell', dot: 'blue' as const },
  { label: 'Config', value: 'Waiting for /api/config', dot: 'gold' as const },
  { label: 'Auth', value: 'Planned', dot: 'purple' as const },
];

export function App() {
  return (
    <>
      <header className="cms-header" role="banner">
        <div className="cms-header__brand">
          <h1 className="cms-header__title">Crypto Idle CMS</h1>
          <span className="cms-header__subtitle">Game management console</span>
        </div>
        <span className="cms-badge">LOCAL</span>
      </header>

      <div className="cms-layout">
        <nav className="cms-sidebar" role="navigation" aria-label="Main navigation">
          <ul className="cms-nav">
            {navItems.map((item) => (
              <li key={item.label} className="cms-nav__item">
                <button
                  className={`cms-nav__btn${item.active ? ' cms-nav__btn--active' : ''}`}
                  aria-current={item.active ? 'page' : undefined}
                  disabled={!item.active}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="cms-main" role="main">
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
            Next: connect <code>/api/config</code>
          </p>
        </main>
      </div>

      <footer className="cms-footer" role="contentinfo">
        Crypto Idle CMS &middot; v0.1.0
      </footer>
    </>
  );
}
