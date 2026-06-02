import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchOrders } from '../../store/slices/ordersSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_LABELS: Record<string, string> = {
  NEW:         'Новый',
  ASSESSED:    'Оценён',
  CONFIRMED:   'Подтверждён',
  IN_PROGRESS: 'В работе',
  READY:       'Готов',
  CLOSED:      'Закрыт',
  CANCELLED:   'Отменён',
};

export default function HomeScreen() {
  const dispatch    = useDispatch<AppDispatch>();
  const navigation  = useNavigation<Nav>();
  const { name }    = useSelector((s: RootState) => s.auth);
  const { list, loading } = useSelector((s: RootState) => s.orders);

  useEffect(() => { dispatch(fetchOrders()); }, []);

  const activeOrders = list.filter(o =>
    !['CLOSED', 'CANCELLED'].includes(o.status)
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => dispatch(fetchOrders())}
          tintColor={Colors.ore}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Привет, {name?.split(' ')[0] ?? 'клиент'}</Text>
          <Text style={styles.headerSub}>МОТОР · Автосервис</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Онлайн</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.qaGrid}>
        <TouchableOpacity
          style={[styles.qa, styles.qaPrimary]}
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.8}
        >
          <Text style={styles.qaIcon}>📅</Text>
          <Text style={styles.qaLabel}>Записаться</Text>
          <Text style={styles.qaSub}>Слесарь · Электрик · Диагност</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.qa}
          onPress={() => navigation.navigate('Chat', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.qaIcon}>🤖</Text>
          <Text style={styles.qaLabel}>AI-чат</Text>
          <Text style={styles.qaSub}>Опишите проблему</Text>
        </TouchableOpacity>
      </View>

      {/* Активные заказы */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>АКТИВНЫЕ ЗАКАЗЫ</Text>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Нет активных заказов</Text>
            <Text style={styles.emptyHint}>Запишитесь на сервис →</Text>
          </View>
        ) : (
          activeOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.8}
            >
              <View style={styles.orderTop}>
                <Text style={styles.orderNum}>{order.orderNumber}</Text>
                <OrderStatusBadge status={order.status} />
              </View>
              <Text style={styles.orderCar}>
                {order.vehicle.brand} {order.vehicle.model} · {order.vehicle.year}
              </Text>
              {order.slot && (
                <Text style={styles.orderSlot}>
                  📅 {new Date(order.slot.startAt).toLocaleString('ru', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })} · {order.slot.post.name}
                </Text>
              )}
              {order.totalRetail && (
                <Text style={styles.orderPrice}>
                  Смета: {Number(order.totalRetail).toLocaleString('ru')} ₽
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* История */}
      {list.filter(o => o.status === 'CLOSED').length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ИСТОРИЯ</Text>
          {list.filter(o => o.status === 'CLOSED').slice(0, 3).map(order => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, styles.orderCardClosed]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.8}
            >
              <View style={styles.orderTop}>
                <Text style={[styles.orderNum, { color: Colors.dust }]}>{order.orderNumber}</Text>
                <Text style={styles.closedBadge}>Закрыт</Text>
              </View>
              <Text style={styles.orderCar}>
                {order.vehicle.brand} {order.vehicle.model}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.xl,
  },
  greeting:  { color: Colors.chalk, fontSize: 24, fontWeight: '900' },
  headerSub: { color: Colors.dust,  fontSize: 11, letterSpacing: 1, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:   { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.green },
  liveText:  { color: Colors.green, fontSize: 11, fontWeight: '700' },
  qaGrid:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  qa: {
    flex: 1, backgroundColor: Colors.plate,
    borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  qaPrimary: { borderLeftWidth: 3, borderLeftColor: Colors.ore },
  qaIcon:    { fontSize: 22, marginBottom: 5 },
  qaLabel:   { color: Colors.chalk, fontSize: 15, fontWeight: '800' },
  qaSub:     { color: Colors.dust, fontSize: 10, marginTop: 3 },
  section:   { marginBottom: Spacing.xl },
  sectionTitle: {
    color: Colors.soot, fontSize: 11, fontWeight: '700',
    letterSpacing: 2, marginBottom: Spacing.sm,
  },
  orderCard: {
    backgroundColor: Colors.plate,
    borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.ore,
  },
  orderCardClosed: { borderLeftColor: Colors.soot, opacity: 0.7 },
  orderTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderNum:  { color: Colors.chalk, fontSize: 17, fontWeight: '900' },
  orderCar:  { color: Colors.ash,   fontSize: 13, marginBottom: 4 },
  orderSlot: { color: Colors.dust,  fontSize: 12, marginBottom: 3 },
  orderPrice:{ color: Colors.teal,  fontSize: 12, fontWeight: '700' },
  closedBadge: { color: Colors.soot, fontSize: 10, fontWeight: '700' },
  emptyCard: {
    backgroundColor: Colors.plate, borderWidth: 1,
    borderColor: Colors.wire, borderRadius: Radius.md,
    padding: Spacing.xl, alignItems: 'center',
  },
  emptyText: { color: Colors.dust,  fontSize: 14 },
  emptyHint: { color: Colors.soot,  fontSize: 12, marginTop: 4 },
});
