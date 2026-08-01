import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { Hexagon, CalendarPlus, ClipboardList, PackageSearch, Bot, User, LogOut } from 'lucide-react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useLocale } from '../services/i18n';
import s from './AppLayout.module.css';

const NAV = [
  { to: '/',        icon: Hexagon,      key: 'nav.client.home'    },
  { to: '/booking', icon: CalendarPlus, key: 'nav.client.booking' },
  { to: '/orders',  icon: ClipboardList,key: 'nav.client.orders'  },
  { to: '/parts',   icon: PackageSearch,key: 'nav.client.parts'   },
  { to: '/chat',    icon: Bot,          key: 'nav.client.chat'    },
  { to: '/profile', icon: User,         key: 'nav.client.profile'},
];

export default function AppLayout() {
  const { t } = useLocale();
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src="/motor_logo.gif" alt="" style={{ width: 20, height: 20, borderRadius: 5 }} /> МОТОР
        </span>
        <span className={s.role}>{t('profile.role.client')}</span>
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
              <span className={s.navLabel}>{t(n.key)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
