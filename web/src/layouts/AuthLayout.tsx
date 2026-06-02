import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export default function AuthLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <div className={styles.logo}>
          <div className={styles.hex}>М</div>
          <span className={styles.brand}>МОТОР</span>
        </div>
        <div className={styles.tagline}>AI-экосистема автосервиса</div>
        <Outlet />
        <p className={styles.ver}>v1.0 · Anthropic Claude AI</p>
      </div>
      <div className={styles.bg}>
        <div className={styles.bgText}>МОТОР</div>
      </div>
    </div>
  );
}
