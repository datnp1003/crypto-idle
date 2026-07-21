import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { StaffListPage } from '../features/staff/StaffListPage';
import { UpgradeListPage } from '../features/upgrades/UpgradeListPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { PlayersPage } from '../features/players/PlayersPage';
import { AuditLogPage } from '../features/audit/AuditLogPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'staff', element: <StaffListPage /> },
      { path: 'upgrades', element: <UpgradeListPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'players', element: <PlayersPage /> },
      { path: 'audit', element: <AuditLogPage /> },
    ],
  },
]);
