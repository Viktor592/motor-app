import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { ClipboardList, BarChart3, Bot, User, LogOut } from 'lucide-react';
import { connectSocket, disconnectSocket } from '../services/socket';
import s from './AppLayout.module.css';

const NAV = [
  { to: '/',          icon: ClipboardList, label: 'Заказы'    },
  { to: '/analytics', icon: BarChart3,     label: 'Аналитика' },
  { to: '/chat',      icon: Bot,           label: 'AI-чат'    },
  { to: '/profile',   icon: User,          label: 'Профиль'   },
];

export default function AppLayout() {
  const role = localStorage.getItem('motor_user_role');
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo}>⬡ МОТОР</span>
        <span className={s.role}>{role === 'MASTER' ? 'Мастер' : 'Приёмщик'}</span>
        <button className={s.logoutBtn}
          onClick={() => { localStorage.clear(); window.location.replace('/login'); }}>
          <LogOut size={14} />
        </button>
      </header>
      <main className={s.main}><Outlet /></main>
      <nav className={s.nav}>
        {NAV.map(n => {
          const Icon = n.icon;
          return (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => [s.navItem, isActive ? s.navActive : ''].join(' ')}>
              <Icon size={20} className={s.navIcon} />
              <span className={s.navLabel}>{n.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
