// ═══════════════════════════════════════════════════
// МОТОР — Shared Constants
// ═══════════════════════════════════════════════════
import type { SpecialistType, BookingStatus, AgentType } from '../types';

// ── Design Tokens (mirrored from HTML system) ────
export const COLORS = {
  void:     '#060608',
  void2:    '#0c0c0f',
  plate:    '#111115',
  plate2:   '#16161b',
  cage:     '#1e1e25',
  wire:     '#2a2a35',
  wire2:    '#353545',
  ore:      '#ff6200',
  ore2:     '#ff8c38',
  ore3:     '#ff3d00',
  teal:     '#00e5c4',
  gold:     '#ffc600',
  blue:     '#3db8ff',
  purple:   '#b86aff',
  green:    '#3ddc68',
  red:      '#ff3b3b',
  chalk:    '#f0f0f5',
  ash:      '#c8c8d8',
  dust:     '#6a6a80',
  soot:     '#3a3a4a',
  carbon:   '#22222e',
} as const;

// ── Specialist meta ──────────────────────────────
export const SPECIALIST_META: Record<
  SpecialistType,
  { label: string; icon: string; color: string; description: string; competencies: string[] }
> = {
  mechanic: {
    label: 'Автослесарь',
    icon: '🔧',
    color: COLORS.ore,
    description: 'Механические работы любой сложности',
    competencies: [
      'Техническое обслуживание (ТО)',
      'Двигатель, ГРМ, охлаждение',
      'Подвеска и рулевое управление',
      'Тормозная система',
      'Трансмиссия, КПП, сцепление',
      'Выхлопная система',
    ],
  },
  electrician: {
    label: 'Автоэлектрик',
    icon: '⚡',
    color: COLORS.blue,
    description: 'Электрика, электроника, ЭБУ',
    competencies: [
      'Электропроводка, реле, предохранители',
      'Аккумулятор, генератор, стартер',
      'Бортовой компьютер (ЭБУ)',
      'Установка сигнализаций и камер',
      'Освещение и мультимедиа',
      'Системы ADAS',
    ],
  },
  diagnostics: {
    label: 'Диагност',
    icon: '🔍',
    color: COLORS.green,
    description: 'Компьютерная диагностика и OBD2',
    competencies: [
      'Считывание и сброс кодов ошибок OBD2',
      'Диагностика всех систем: двигатель, ABS, SRS',
      'Анализ данных в реальном времени',
      'Проверка адаптаций и обучений',
      'Кодирование блоков управления',
      'AI-отчёт с гипотезами',
    ],
  },
};

// ── Booking status labels ────────────────────────
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  new:         'Новая',
  estimated:   'Оценена',
  confirmed:   'Подтверждена',
  in_progress: 'В работе',
  ready:       'Готова',
  closed:      'Закрыта',
  cancelled:   'Отменена',
};

export const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  new:         COLORS.dust,
  estimated:   COLORS.gold,
  confirmed:   COLORS.blue,
  in_progress: COLORS.ore,
  ready:       COLORS.green,
  closed:      COLORS.soot,
  cancelled:   COLORS.red,
};

// ── Agent labels ─────────────────────────────────
export const AGENT_LABEL: Record<AgentType, string> = {
  receiver:     '🤝 Приёмщик',
  estimator:    '💰 Оценщик',
  diagnostician:'🔍 Диагност',
  supplier:     '📦 Снабженец',
  planner:      '📅 Планировщик',
  accountant:   '🧾 Бухгалтер',
};

// ── Time slots ───────────────────────────────────
export const WORKING_HOURS = [
  '09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00',
  '17:00','18:00','19:00','20:00',
];

// ── Weekday names (ru) ───────────────────────────
export const WEEKDAYS_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
export const MONTHS_SHORT = [
  'янв','фев','мар','апр','май','июн',
  'июл','авг','сен','окт','ноя','дек',
];
