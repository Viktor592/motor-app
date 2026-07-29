import React from 'react';
import { useLocale } from '../services/i18n';

const CFG: Record<string, { color: string; bg: string }> = {
  NEW:         { color: 'var(--blue)',   bg: 'var(--blue-d)' },
  ASSESSED:    { color: '#ffc600',       bg: 'rgba(255,198,0,.1)' },
  CONFIRMED:   { color: 'var(--teal)',   bg: 'var(--teal-d)' },
  IN_PROGRESS: { color: 'var(--ore)',    bg: 'var(--ore-d)' },
  READY:       { color: 'var(--green)',  bg: 'var(--green-d)' },
  CLOSED:      { color: 'var(--dust)',   bg: 'var(--cage)' },
  CANCELLED:   { color: 'var(--red)',    bg: 'rgba(255,59,59,.1)' },
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const c = CFG[status] ?? CFG.NEW;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: 3,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.color}50`,
    }}>
      {t(`order.status.${status}`)}
    </span>
  );
}
