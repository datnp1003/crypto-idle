import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/staff', label: 'Staff' },
  { to: '/upgrades', label: 'Upgrades' },
  { to: '/settings', label: 'Settings' },
  { to: '/players', label: 'Players' },
  { to: '/audit', label: 'Audit' },
];

export function AppShell() {
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
            {NAV_ITEMS.map(({ to, label }) => (
              <li key={to} className="cms-nav__item">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `cms-nav__btn${isActive ? ' cms-nav__btn--active' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="cms-main" role="main">
          <Outlet />
        </main>
      </div>

      <footer className="cms-footer" role="contentinfo">
        Crypto Idle CMS &middot; v0.1.0
      </footer>
    </>
  );
}
