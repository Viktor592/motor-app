import { Outlet, NavLink } from 'react-router-dom';
import { Building2, Users, Megaphone, LogOut } from 'lucide-react';
import s from '../layouts/AppLayout.module.css';

const NAV = [
  { to: '/',            icon: Building2, label: 'Автосервисы' },
  { to: '/users',       icon: Users,     label: 'Пользователи' },
  { to: '/promotions',  icon: Megaphone, label: 'Акции'        },
];

export default function SuperAdminLayout() {
  const name = localStorage.getItem('motor_user_name') ?? '';

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.sideTop}>
          <div className={s.logo}>
            <span className={s.hex}>М</span>
            <span className={s.brand}>МОТОР</span>
          </div>
          <nav className={s.nav}>
            <div className={s.group}>
              <div className={s.groupLabel}>Платформа</div>
              {NAV.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'}
                    className={({ isActive }) => [s.navItem, isActive ? s.navActive : ''].join(' ')}>
                    <Icon size={17} className={s.navIcon} />
                    <span className={s.navLabel}>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
        <div className={s.sideBot}>
          <div className={s.userRow}>
            <span className={s.userAva}>{name.slice(0,1).toUpperCase() || 'S'}</span>
            <span>
              <div className={s.userName}>{name || 'Супер-админ'}</div>
              <div className={s.userRole}>Платформа</div>
            </span>
          </div>
          <button className={s.logoutBtn}
            onClick={() => { localStorage.clear(); window.location.replace('/admin/login'); }}>
            <LogOut size={13} /> Выйти
          </button>
        </div>
      </aside>
      <main className={s.main}><Outlet /></main>
    </div>
  );
}
