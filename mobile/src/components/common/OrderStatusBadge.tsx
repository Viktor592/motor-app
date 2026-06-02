import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW:         { label: 'Новый',        color: Colors.blue,   bg: Colors.blueD },
  ASSESSED:    { label: 'Оценён',       color: Colors.gold,   bg: 'rgba(255,198,0,0.1)' },
  CONFIRMED:   { label: 'Подтверждён', color: Colors.teal,   bg: Colors.tealD },
  IN_PROGRESS: { label: 'В работе',     color: Colors.ore,    bg: Colors.oreD },
  READY:       { label: 'Готов',        color: Colors.green,  bg: Colors.greenD },
  CLOSED:      { label: 'Закрыт',       color: Colors.dust,   bg: Colors.cage },
  CANCELLED:   { label: 'Отменён',      color: Colors.red,    bg: 'rgba(255,59,59,0.1)' },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NEW;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
