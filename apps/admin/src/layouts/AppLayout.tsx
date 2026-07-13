import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Gauge, ClipboardList, CalendarDays, Package, Wallet, TrendingUp,
  BarChart3, FileText, Plug, Users, Gem, Settings, Bot, User, LogOut, Megaphone,
} from 'lucide-react';
import { connectSocket, disconnectSocket } from '../services/socket';
import s from './AppLayout.module.css';

const GROUPS = [
  {
    label: 'Обзор',
    items: [{ to: '/', icon: Gauge, label: 'Панель' }],
  },
  {
    label: 'Работа',
    items: [
      { to: '/orders',    icon: ClipboardList, label: 'Заказы'   },
      { to: '/bookings',  icon: CalendarDays,  label: 'Записи'   },
      { to: '/warehouse', icon: Package,       label: 'Склад'    },
    ],
  },
  {
    label: 'Финансы',
    items: [
      { to: '/finance', icon: Wallet,     label: 'Финансы' },
      { to: '/pnl',     icon: TrendingUp, label: 'P&L'     },
      { to: '/report',  icon: BarChart3,  label: 'Отчёты'  },
    ],
  },
  {
    label: 'Команда и тариф',
    items: [
      { to: '/staff',      icon: Users,     label: 'Сотрудники' },
      { to: '/promotions', icon: Megaphone, label: 'Акции'      },
      { to: '/plans',      icon: Gem,       label: 'Тариф'      },
    ],
  },
  {
    label: 'Система',
    items: [
      { to: '/edo',         icon: FileText, label: 'ЭДО'         },
      { to: '/integration', icon: Plug,     label: 'Интеграции'  },
      { to: '/chat',        icon: Bot,      label: 'AI-чат'      },
      { to: '/settings',    icon: Settings, label: 'Настройки'   },
    ],
  },
];

export default function AppLayout() {
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);
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
              <div className={s.userName}>{name || 'Владелец'}</div>
              <div className={s.userRole}>Владелец сервиса</div>
            </span>
          </NavLink>
          <button className={s.logoutBtn}
            onClick={() => { localStorage.clear(); window.location.replace('/owner/login'); }}>
            <LogOut size={13} /> Выйти
          </button>
        </div>
      </aside>
      <main className={s.main}><Outlet /></main>
    </div>
  );
}
