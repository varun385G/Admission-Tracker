import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/calendar': 'Follow-up Calendar',
  '/staff': 'Staff Management',
  '/reports': 'Reports & Analytics',
};

export default function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'AdmissionDesk';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0,
        }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 700 }}>{title}</h1>
        </header>
        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
