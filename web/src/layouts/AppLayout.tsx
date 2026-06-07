import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { logout } from '../slices/authSlice';
import { connectSocket, disconnectSocket } from '../services/socket';
import { registerWebPush } from '../services/webPush';
import styles from './AppLayout.module.css';

const NAV_CLIENT = [
  { to: '/',             icon: '⬡', label: 'Главная'  },
  { to: '/booking',      icon: '📅', label: 'Запись'   },
  { to: '/orders',       icon: '📋', label: 'Заказы'   },
  { to: '/chat',         icon: '🤖', label: 'AI-чат'   },
  { to: '/profile',      icon: '👤', label: 'Профиль'  },
];

const NAV_STAFF = [
  { to: '/exec/orders',  icon: '📋', label: 'Канбан'   },
  { to: '/orders',       icon: '📂', label: 'Все заказы' },
  { to: '/chat',         icon: '🤖', label: 'AI-чат'   },
  { to: '/profile',      icon: '👤', label: 'Профиль'  },
];

const NAV_ADMIN = [
  { to: '/admin',             icon: '⚙',  label: 'Панель'     },
  { to: '/warehouse',         icon: '📦', label: 'Склад'      },
  { to: '/finance',           icon: '💰', label: 'Финансы'    },
  { to: '/bookings',          icon: '📅', label: 'Записи'     },
  { to: '/report',            icon: '📈', label: 'Отчёты'    },
  { to: '/integration',       icon: '🔗', label: 'Интеграции'},
  { to: '/plans',             icon: '💳', label: 'Тариф'      },
  { to: '/edo',               icon: '🏛️', label: 'ЭДО / ФНС'  },
  { to: '/settings',          icon: '🔧', label: 'Настройки'  },
  { to: '/analytics/pnl',    icon: '📊', label: 'P&L'        },
  { to: '/exec/orders',      icon: '📋', label: 'Канбан'     },
  { to: '/orders',           icon: '📂', label: 'Заказы'     },
  { to: '/chat',             icon: '🤖', label: 'AI-чат'     },
  { to: '/profile',          icon: '👤', label: 'Профиль'    },
];

const NAV_MASTER = [
  { to: '/analytics/master', icon: '📊', label: 'Аналитика'  },
  { to: '/exec/orders',      icon: '📋', label: 'Заказы'     },
  { to: '/chat',             icon: '🤖', label: 'AI-чат'     },
  { to: '/profile',          icon: '👤', label: 'Профиль'    },
];

export default function AppLayout() {
  const dispatch   = useDispatch<AppDispatch>();
  const navigate   = useNavigate();
  const { name, role } = useSelector((s: RootState) => s.auth);
  const NAV = role === 'CLIENT' ? NAV_CLIENT : role === 'ADMIN' ? NAV_ADMIN : role === 'MASTER' ? NAV_MASTER : NAV_STAFF;

  useEffect(() => {
    connectSocket();
    registerWebPush();
    return disconnectSocket;
  }, []);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <div className={styles.logo}>
            <div className={styles.hex}>М</div>
            <span className={styles.brand}>МОТОР</span>
          </div>
          <nav className={styles.nav}>
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navActive : ''}`
                }
              >
                <span className={styles.navIcon}>{n.icon}</span>
                <span className={styles.navLabel}>{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className={styles.sideBot}>
          <div className={styles.userRow}>
            <div className={styles.userAva}>{name?.[0] ?? '?'}</div>
            <div>
              <div className={styles.userName}>{name}</div>
              <div className={styles.userRole}>{role}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Выйти →</button>
        </div>
      </aside>

      {/* Content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
