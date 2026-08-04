import { Outlet, NavLink } from 'react-router-dom';
import { Building2, Users, Megaphone, LogOut } from 'lucide-react';
import { useLocale } from '../services/i18n';
import s from '../layouts/AppLayout.module.css';

export default function SuperAdminLayout() {
  const { t } = useLocale();
  const NAV = [
    { to: '/',            icon: Building2, label: t('super_admin.nav.services')   },
    { to: '/users',       icon: Users,     label: t('super_admin.nav.users')      },
    { to: '/promotions',  icon: Megaphone, label: t('super_admin.nav.promotions') },
  ];
  const name = localStorage.getItem('motor_user_name') ?? '';

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.sideTop}>
          <div className={s.logo}>
            <img src="/motor_logo.gif" alt="МОТОР" className={s.hex} />
            <span className={s.brand}>МОТОР</span>
          </div>
          <nav className={s.nav}>
            <div className={s.group}>
              <div className={s.groupLabel}>{t('super_admin.platform_group')}</div>
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
          <NavLink to="/profile" className={s.userRow}>
            <span className={s.userAva}>{name.slice(0,1).toUpperCase() || 'S'}</span>
            <span>
              <div className={s.userName}>{name || t('super_admin.name_fallback')}</div>
              <div className={s.userRole}>{t('super_admin.platform_group')}</div>
            </span>
          </NavLink>
          <button className={s.logoutBtn}
            onClick={() => { localStorage.clear(); window.location.replace('/admin/login'); }}>
            <LogOut size={13} /> {t('super_admin.logout')}
          </button>
        </div>
      </aside>
      <main className={s.main}><Outlet /></main>
    </div>
  );
}
