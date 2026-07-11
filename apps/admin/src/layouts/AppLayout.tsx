import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import s from './AppLayout.module.css';

const NAV = [
  { to: '/',           icon: '⚙',  label: 'Панель'      },
  { to: '/orders',     icon: '📋', label: 'Заказы'      },
  { to: '/bookings',   icon: '📅', label: 'Записи'      },
  { to: '/warehouse',  icon: '📦', label: 'Склад'       },
  { to: '/finance',    icon: '💰', label: 'Финансы'     },
  { to: '/pnl',        icon: '📊', label: 'P&L'         },
  { to: '/report',     icon: '📈', label: 'Отчёты'      },
  { to: '/edo',        icon: '📄', label: 'ЭДО'         },
  { to: '/integration',icon: '🔗', label: 'Интеграции'  },
  { to: '/staff',      icon: '👥', label: 'Сотрудники'  },
  { to: '/plans',      icon: '💎', label: 'Тариф'       },
  { to: '/settings',   icon: '🛠', label: 'Настройки'   },
  { to: '/chat',       icon: '🤖', label: 'AI-чат'      },
  { to: '/profile',    icon: '👤', label: 'Профиль'     },
];

export default function AppLayout() {
  useEffect(() => { connectSocket(); return disconnectSocket; }, []);

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.logo}>⬡ МОТОР</div>
        <div className={s.roleTag}>Администратор</div>
        <nav className={s.sideNav}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => [s.sideLink, isActive ? s.active : ''].join(' ')}>
              <span className={s.icon}>{n.icon}</span>
              <span className={s.label}>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className={s.logout}
          onClick={() => { localStorage.clear(); window.location.replace('/owner/login'); }}>
          → Выйти
        </button>
      </aside>
      <main className={s.content}><Outlet /></main>
    </div>
  );
}
