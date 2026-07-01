import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import s from './AppLayout.module.css';

const NAV = [
  { to: '/',        icon: '⬡',  label: 'Главная' },
  { to: '/booking', icon: '📅', label: 'Запись'  },
  { to: '/orders',  icon: '📋', label: 'Заказы'  },
  { to: '/chat',    icon: '🤖', label: 'AI-чат'  },
  { to: '/profile', icon: '👤', label: 'Профиль' },
];

const SAAS = import.meta.env.VITE_SAAS_URL ?? 'http://localhost:3000';

export default function AppLayout() {
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo}>⬡ МОТОР</span>
        <span className={s.role}>Клиент</span>
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
