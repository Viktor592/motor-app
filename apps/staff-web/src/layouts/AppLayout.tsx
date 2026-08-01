import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { ClipboardList, CalendarDays, BarChart3, User, LogOut } from 'lucide-react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useLocale } from '../services/i18n';
import s from './AppLayout.module.css';

export default function AppLayout() {
  const { t } = useLocale();
  const role = localStorage.getItem('motor_user_role');
  const NAV = [
    { to: '/',          icon: ClipboardList, label: t('nav.staff.orders')    },
    ...(role === 'RECEPTIONIST' ? [{ to: '/bookings', icon: CalendarDays, label: t('nav.staff.bookings') }] : []),
    { to: '/analytics', icon: BarChart3,     label: t('nav.staff.analytics') },
    { to: '/profile',   icon: User,          label: t('nav.staff.profile')   },
  ];
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src="/motor_logo.gif" alt="" style={{ width: 20, height: 20, borderRadius: 5 }} /> МОТОР
        </span>
        <span className={s.role}>{role === 'MASTER' ? t('role.master') : t('role.receptionist')}</span>
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
