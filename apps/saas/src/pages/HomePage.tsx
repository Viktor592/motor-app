import { Link } from 'react-router-dom';
import styles from './Auth.module.css';

const env = (import.meta as any).env ?? {};
const CLIENT_WEB = env.VITE_CLIENT_WEB_URL ?? 'http://localhost:3001';
const STAFF_WEB  = env.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002';
const ADMIN      = env.VITE_ADMIN_URL      ?? 'http://localhost:3003';

export default function HomePage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.form}>
        <h2 className={styles.title}>МОТОР</h2>
        <p className={styles.sub}>Платформа для автосервисов</p>

        <a className={styles.btn} href={`${CLIENT_WEB}/login`}>Я клиент — войти</a>
        <a className={styles.btn} href={`${ADMIN}/owner/login`}>Я владелец автосервиса — войти</a>
        <a className={styles.btn} href={`${STAFF_WEB}/login`}>Я сотрудник автосервиса — войти</a>

        <p className={styles.link}>Нет аккаунта? <Link to="/register">Регистрация клиента</Link> · <Link to="/owner/register">Регистрация автосервиса</Link></p>
        <p className={styles.link} style={{ marginTop: 24, opacity: 0.5 }}>
          <a href={`${ADMIN}/admin/login`}>Вход супер-админа</a>
        </p>
        <p className={styles.link} style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
          <Link to="/privacy">Политика обработки персональных данных</Link>
          {' · '}
          <Link to="/offer">Публичная оферта</Link>
        </p>
      </div>
    </div>
  );
}
