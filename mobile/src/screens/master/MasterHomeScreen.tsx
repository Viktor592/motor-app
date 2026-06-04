/**
 * MasterHomeScreen — главный экран мастера
 * Активные заказы, быстрые действия, статистика дня
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';
import { Colors } from '../../theme';

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  specialistType: string;
  vehicle: { make: string; model: string; plate: string };
  client: { name: string; phone: string };
  createdAt: string;
  totalRetail: number | null;
}

interface DayStat {
  ordersToday: number;
  revenueToday: number;
  inProgress: number;
  avgTime: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', IN_PROGRESS: 'В работе',
  WAITING_PARTS: 'Ждёт запчасти', QUALITY_CHECK: 'Проверка',
  DONE: 'Готов', CLOSED: 'Закрыт',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#d97706', IN_PROGRESS: '#2563eb',
  WAITING_PARTS: '#7c3aed', QUALITY_CHECK: '#0891b2',
  DONE: '#16a34a', CLOSED: '#6b7280',
};
const SPEC_ICONS: Record<string, string> = {
  AUTO_ELECTRICIAN: '⚡', TIRE_FITTER: '🔧',
  MECHANIC: '🔩', BODY: '🚗', DIAGNOSTICIAN: '🖥',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function MasterHomeScreen() {
  const navigation = useNavigation<any>();
  const { name, role } = useSelector((s: RootState) => s.auth);

  const [orders, setOrders]       = useState<ActiveOrder[]>([]);
  const [stats, setStats]         = useState<DayStat | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ordersData, statsData] = await Promise.all([
        api.get('/orders?status=PENDING,IN_PROGRESS,WAITING_PARTS,QUALITY_CHECK,DONE&limit=20'),
        api.get('/analytics/master/me?period=week'),
      ]);
      setOrders(ordersData.orders ?? []);
      setStats({
        ordersToday: statsData.summary?.totalOrders ?? 0,
        revenueToday: statsData.summary?.totalRetail ?? 0,
        inProgress: statsData.summary?.inProgress ?? 0,
        avgCheck: statsData.summary?.avgCheck ?? 0,
      } as any);
    } catch (e) {
      console.warn('[MasterHome]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.ore} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.ore} />}
    >
      {/* Приветствие */}
      <View style={s.greeting}>
        <Text style={s.greetingName}>Привет, {name?.split(' ')[0] ?? 'Мастер'} 👋</Text>
        <Text style={s.greetingRole}>{role === 'ADMIN' ? 'Администратор' : role === 'RECEPTIONIST' ? 'Ресепшн' : 'Мастер'}</Text>
      </View>

      {/* Статистика дня */}
      {stats && (
        <View style={s.statsRow}>
          {[
            { label: 'Заказов',   value: String(stats.ordersToday),          color: Colors.chalk },
            { label: 'В работе',  value: String(stats.inProgress),           color: '#2563eb'   },
            { label: 'Выручка',   value: fmt(stats.revenueToday),            color: Colors.ore  },
          ].map(item => (
            <View key={item.label} style={s.statBox}>
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Быстрые действия */}
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('NewOrder')}>
          <Text style={s.quickIcon}>➕</Text>
          <Text style={s.quickLabel}>Новый заказ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('Scanner')}>
          <Text style={s.quickIcon}>📷</Text>
          <Text style={s.quickLabel}>Сканер гос.№</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('Chat')}>
          <Text style={s.quickIcon}>🤖</Text>
          <Text style={s.quickLabel}>AI-помощник</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('MasterAnalytics')}>
          <Text style={s.quickIcon}>📊</Text>
          <Text style={s.quickLabel}>Аналитика</Text>
        </TouchableOpacity>
      </View>

      {/* Активные заказы */}
      <Text style={s.sectionTitle}>Активные заказы ({orders.length})</Text>

      {orders.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>🎉</Text>
          <Text style={s.emptyText}>Нет активных заказов</Text>
        </View>
      ) : (
        orders.map(order => (
          <TouchableOpacity
            key={order.id}
            style={s.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            activeOpacity={0.75}
          >
            <View style={s.orderTop}>
              <View style={s.orderNumRow}>
                <Text style={s.specIcon}>{SPEC_ICONS[order.specialistType] ?? '🔧'}</Text>
                <Text style={s.orderNum}>#{order.orderNumber}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '22' }]}>
                <Text style={[s.statusText, { color: STATUS_COLORS[order.status] }]}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </Text>
              </View>
            </View>

            <Text style={s.vehicle}>
              {order.vehicle.make} {order.vehicle.model} · {order.vehicle.plate}
            </Text>
            <Text style={s.client}>{order.client.name} · {order.client.phone}</Text>

            <View style={s.orderBottom}>
              <Text style={s.orderTime}>
                {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {order.totalRetail != null && (
                <Text style={s.orderPrice}>{fmt(order.totalRetail)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.void },
  content: { padding: 16, paddingBottom: 32 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.void },

  greeting:     { marginBottom: 20 },
  greetingName: { fontSize: 22, fontWeight: '700', color: Colors.chalk },
  greetingRole: { fontSize: 13, color: Colors.dust, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox:  { flex: 1, backgroundColor: Colors.plate, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.wire },
  statValue:{ fontSize: 18, fontWeight: '800' },
  statLabel:{ fontSize: 11, color: Colors.dust, marginTop: 4 },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  quickBtn: { flex: 1, backgroundColor: Colors.plate, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.wire },
  quickIcon:{ fontSize: 22, marginBottom: 4 },
  quickLabel:{ fontSize: 10, color: Colors.dust, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.chalk, marginBottom: 12 },

  emptyBox:  { backgroundColor: Colors.plate, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: Colors.wire },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.dust },

  orderCard:   { backgroundColor: Colors.plate, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.wire },
  orderTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  specIcon:    { fontSize: 18 },
  orderNum:    { fontSize: 15, fontWeight: '700', color: Colors.chalk },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:  { fontSize: 12, fontWeight: '700' },
  vehicle:     { fontSize: 14, color: Colors.chalk, marginBottom: 2 },
  client:      { fontSize: 12, color: Colors.dust, marginBottom: 10 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  orderTime:   { fontSize: 12, color: Colors.dust },
  orderPrice:  { fontSize: 14, fontWeight: '700', color: Colors.ore },
});
