import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/students', label: 'Students', icon: '👥' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
];

const ADMIN_ITEMS = [
  { to: '/staff', label: 'Staff', icon: '👤' },
  { to: '/reports', label: 'Reports', icon: '📊' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <aside style={{
      width: 220, background: 'var(--sidebar)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflowY: 'auto', height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: 'Syne,sans-serif', color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
          AdmissionDesk
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>College CRM</div>
      </div>

      {/* User */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{user?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1, textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        <div style={{ padding: '10px 18px 4px', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600 }}>Main</div>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              color: isActive ? '#fff' : 'var(--sidebar-text)',
              background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ padding: '14px 18px 4px', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
            {ADMIN_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
                  textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  color: isActive ? '#fff' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.15s',
                })}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          color: 'var(--sidebar-text)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text)'}
        >
          <span style={{ fontSize: 14 }}>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
