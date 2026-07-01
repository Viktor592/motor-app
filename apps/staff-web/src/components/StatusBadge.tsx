import React from 'react';

const CFG: Record<string, { label: string; color: string; bg: string }> = {
  NEW:         { label: 'Новый',       color: 'var(--blue)',   bg: 'var(--blue-d)' },
  ASSESSED:    { label: 'Оценён',      color: '#ffc600',       bg: 'rgba(255,198,0,.1)' },
  CONFIRMED:   { label: 'Подтверждён', color: 'var(--teal)',   bg: 'var(--teal-d)' },
  IN_PROGRESS: { label: 'В работе',    color: 'var(--ore)',    bg: 'var(--ore-d)' },
  READY:       { label: 'Готов',       color: 'var(--green)',  bg: 'var(--green-d)' },
  CLOSED:      { label: 'Закрыт',      color: 'var(--dust)',   bg: 'var(--cage)' },
  CANCELLED:   { label: 'Отменён',     color: 'var(--red)',    bg: 'rgba(255,59,59,.1)' },
};

export function StatusBadge({ status }: { status: string }) {
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
      {c.label}
    </span>
  );
}
