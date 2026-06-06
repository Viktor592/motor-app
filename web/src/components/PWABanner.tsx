import { usePWA } from '../hooks/usePWA';
import styles from './PWABanner.module.css';

export default function PWABanner() {
  const { isInstallable, isOffline, updateAvailable, install, applyUpdate } = usePWA();

  if (!isInstallable && !isOffline && !updateAvailable) return null;

  return (
    <div className={styles.container}>
      {/* Офлайн */}
      {isOffline && (
        <div className={`${styles.banner} ${styles.offline}`}>
          <span>📡 Нет интернета — работаем в офлайн режиме</span>
        </div>
      )}

      {/* Обновление */}
      {updateAvailable && (
        <div className={`${styles.banner} ${styles.update}`}>
          <span>🔄 Доступна новая версия МОТОР</span>
          <button className={styles.btn} onClick={applyUpdate}>Обновить</button>
        </div>
      )}

      {/* Установка */}
      {isInstallable && !isOffline && (
        <div className={`${styles.banner} ${styles.install}`}>
          <div className={styles.installLeft}>
            <span className={styles.installIcon}>⚡</span>
            <div>
              <div className={styles.installTitle}>Установить приложение</div>
              <div className={styles.installSub}>Работает офлайн, быстрее браузера</div>
            </div>
          </div>
          <button className={styles.btnInstall} onClick={install}>Установить</button>
        </div>
      )}
    </div>
  );
}
