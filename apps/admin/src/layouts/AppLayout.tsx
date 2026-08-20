import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Gauge, ClipboardList, CalendarDays, Package, Wallet, TrendingUp,
  BarChart3, FileText, Plug, Users, Gem, Settings, User, LogOut, Megaphone,
} from 'lucide-react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useLocale } from '../services/i18n';
import s from './AppLayout.module.css';

export default function AppLayout() {
  const { t } = useLocale();
  const GROUPS = [
    {
      label: t('admin_nav.group_overview'),
      items: [{ to: '/', icon: Gauge, label: t('admin_nav.dashboard') }],
    },
    {
      label: t('admin_nav.group_work'),
      items: [
        { to: '/orders',    icon: ClipboardList, label: t('admin_nav.orders')    },
        { to: '/bookings',  icon: CalendarDays,  label: t('admin_nav.bookings')  },
        { to: '/warehouse', icon: Package,       label: t('admin_nav.warehouse') },
      ],
    },
    {
      label: t('admin_nav.group_finance'),
      items: [
        { to: '/finance', icon: Wallet,     label: t('admin_nav.group_finance') },
        { to: '/pnl',     icon: TrendingUp, label: 'P&L'     },
        { to: '/report',  icon: BarChart3,  label: t('admin_nav.reports') },
      ],
    },
    {
      label: t('admin_nav.group_team'),
      items: [
        { to: '/staff',      icon: Users,     label: t('admin_nav.staff')      },
        { to: '/promotions', icon: Megaphone, label: t('admin_nav.promotions') },
        { to: '/plans',      icon: Gem,       label: t('admin_nav.plans')      },
      ],
    },
    {
      label: t('admin_nav.group_system'),
      items: [
        { to: '/edo',         icon: FileText, label: t('admin_nav.edo')         },
        { to: '/integration', icon: Plug,     label: t('admin_nav.integration') },
        { to: '/settings',    icon: Settings, label: t('admin_nav.settings')    },
      ],
    },
  ];
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);
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
            {GROUPS.map(group => (
              <div key={group.label} className={s.group}>
                <div className={s.groupLabel}>{group.label}</div>
                {group.items.map(item => {
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
            ))}
          </nav>
        </div>

        <div className={s.sideBot}>
          <NavLink to="/profile" className={({ isActive }) => [s.userRow, isActive ? s.userRowActive : ''].join(' ')}>
            <span className={s.userAva}><User size={15} /></span>
            <span>
              <div className={s.userName}>{name || t('admin_nav.owner_fallback')}</div>
              <div className={s.userRole}>{t('admin_nav.owner_role')}</div>
            </span>
          </NavLink>
          <button className={s.logoutBtn}
            onClick={() => { localStorage.clear(); window.location.replace('/owner/login'); }}>
            <LogOut size={13} /> {t('super_admin.logout')}
          </button>
        </div>
      </aside>
      <main className={s.main}><Outlet /></main>
    </div>
  );
}
