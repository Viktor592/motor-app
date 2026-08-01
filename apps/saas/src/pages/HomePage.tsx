import { Link } from 'react-router-dom';
import { useLocale } from '../services/i18n';
import styles from './Auth.module.css';

const env = (import.meta as any).env ?? {};
const CLIENT_WEB = env.VITE_CLIENT_WEB_URL ?? 'http://localhost:3001';
const STAFF_WEB  = env.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002';
const ADMIN      = env.VITE_ADMIN_URL      ?? 'http://localhost:3003';

export default function HomePage() {
  const { t } = useLocale();
  return (
    <div className={styles.wrap}>
      <div className={styles.form}>
        <h2 className={styles.title}>МОТОР</h2>
        <p className={styles.sub}>{t('home.subtitle')}</p>

        <a className={styles.btn} href={`${CLIENT_WEB}/login`}>{t('home.client_login')}</a>
        <a className={styles.btn} href={`${ADMIN}/owner/login`}>{t('home.owner_login')}</a>
        <a className={styles.btn} href={`${STAFF_WEB}/login`}>{t('home.staff_login')}</a>

        <p className={styles.link}>{t('auth.no_account')} <Link to="/register">{t('home.client_register')}</Link> · <Link to="/owner/register">{t('home.owner_register')}</Link></p>
        <p className={styles.link} style={{ marginTop: 24, opacity: 0.5 }}>
          <a href={`${ADMIN}/admin/login`}>{t('home.superadmin_login')}</a>
        </p>
        <p className={styles.link} style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
          <Link to="/privacy">{t('home.privacy_policy')}</Link>
          {' · '}
          <Link to="/offer">{t('home.public_offer')}</Link>
        </p>
      </div>
    </div>
  );
}
