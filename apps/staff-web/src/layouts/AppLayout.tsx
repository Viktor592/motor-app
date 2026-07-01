import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import s from './AppLayout.module.css';

const SAAS = import.meta.env.VITE_SAAS_URL ?? 'http://localhost:3000';

const NAV = [
  { to: '/',          icon: '📋', label: 'Заказы'    },
  { to: '/analytics', icon: '📊', label: 'Аналитика' },
  { to: '/chat',      icon: '🤖', label: 'AI-чат'    },
  { to: '/profile',   icon: '👤', label: 'Профиль'   },
];

export default function AppLayout() {
  const role = localStorage.getItem('motor_user_role');
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo}>⬡ МОТОР</span>
        <span className={s.role}>{role === 'MASTER' ? 'Мастер' : 'Исполнитель'}</span>
        <button className={s.logout} onClick={() => { localStorage.clear(); window.location.replace(SAAS); }}>
          Выйти
        </button>
      </header>
      <main className={s.main}><Outlet /></main>
      <nav className={s.nav}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) => [s.link, isActive ? s.active : ''].join(' ')}>
            <span className={s.icon}>{n.icon}</span>
            <span className={s.label}>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
