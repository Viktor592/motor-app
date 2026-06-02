// МОТОР Design System — Mobile Theme
// Соответствует CSS-переменным из документации

export const Colors = {
  // Backgrounds
  void:   '#060608',
  void2:  '#0c0c0f',
  plate:  '#111115',
  plate2: '#16161b',
  cage:   '#1e1e25',
  wire:   '#2a2a35',
  wire2:  '#353545',

  // Brand
  ore:    '#ff6200',
  ore2:   '#ff8c38',
  ore3:   '#ff3d00',
  oreD:   'rgba(255,98,0,0.12)',
  oreG:   'rgba(255,98,0,0.25)',

  // Accent
  teal:   '#00e5c4',
  tealD:  'rgba(0,229,196,0.1)',
  gold:   '#ffc600',
  blue:   '#3db8ff',
  blueD:  'rgba(61,184,255,0.08)',
  purple: '#b86aff',
  green:  '#3ddc68',
  greenD: 'rgba(61,220,104,0.1)',
  red:    '#ff3b3b',

  // Text
  chalk:  '#f0f0f5',
  ash:    '#c8c8d8',
  dust:   '#6a6a80',
  soot:   '#3a3a4a',
  carbon: '#22222e',
} as const;

export const Typography = {
  display:  'BebasNeue-Regular',     // Заголовки
  ui:       'BarlowCondensed-Bold',  // UI элементы
  body:     'Barlow-Regular',        // Основной текст
  mono:     'JetBrainsMono-Regular', // Коды, номера
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 3,
  md: 6,
  lg: 12,
  full: 999,
} as const;
