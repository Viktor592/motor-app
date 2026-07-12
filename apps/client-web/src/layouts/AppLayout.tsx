import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { Hexagon, CalendarPlus, ClipboardList, Bot, User, LogOut } from 'lucide-react';
import { connectSocket, disconnectSocket } from '../services/socket';
import s from './AppLayout.module.css';

const NAV = [
  { to: '/',        icon: Hexagon,      label: 'Главная' },
  { to: '/booking', icon: CalendarPlus, label: 'Запись'  },
  { to: '/orders',  icon: ClipboardList,label: 'Заказы'  },
  { to: '/chat',    icon: Bot,          label: 'AI-чат'  },
  { to: '/profile', icon: User,         label: 'Профиль' },
];

export default function AppLayout() {
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo}>⬡ МОТОР</span>
        <span className={s.role}>Клиент</span>
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
