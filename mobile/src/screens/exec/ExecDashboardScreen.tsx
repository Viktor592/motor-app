import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';

const SPEC_LABELS: Record<string, string> = {
  MECHANIC: '🔧 Слесарь', ELECTRICIAN: '⚡ Электрик', DIAGNOSTICS: '🔍 Диагност',
};

const STATUS_FILTERS = ['Все', 'NEW', 'CONFIRMED', 'IN_PROGRESS', 'READY'];

export default function ExecDashboardScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading } = useSelector((s: RootState) => s.orders);
  const [filter, setFilter] = useState('Все');

  useEffect(() => { dispatch(fetchOrders()); }, []);

  const shown = filter === 'Все' ? list : list.filter(o => o.status === filter);
  const stats = {
    new:        list.filter(o => o.status === 'NEW').length,
    inProgress: list.filter(o => o.status === 'IN_PROGRESS').length,
    ready:      list.filter(o => o.status === 'READY').length,
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eye}>// ИСПОЛНИТЕЛЬ</Text>
          <Text style={s.h1}>РАБОЧИЙ ДЕНЬ</Text>
        </View>
        <View style={s.livePill}>
          <View style={s.liveDot} />
          <Text style={s.liveT}>Онлайн</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.stat, { borderLeftColor: Colors.blue }]}>
          <Text style={[s.statVal, { color: Colors.blue }]}>{stats.new}</Text>
          <Text style={s.statL}>Новых</Text>
        </View>
        <View style={[s.stat, { borderLeftColor: Colors.ore }]}>
          <Text style={[s.statVal, { color: Colors.ore }]}>{stats.inProgress}</Text>
          <Text style={s.statL}>В работе</Text>
        </View>
        <View style={[s.stat, { borderLeftColor: Colors.green }]}>
          <Text style={[s.statVal, { color: Colors.green }]}>{stats.ready}</Text>
          <Text style={s.statL}>Готово</Text>
        </View>
      </View>

      {/* Ссылка на аналитику */}
      <TouchableOpacity
        style={{
          marginHorizontal: 16, marginBottom: 12,
          backgroundColor: '#1e1e25', borderWidth: 1,
          borderColor: '#2a2a35', borderRadius: 4,
          padding: 12, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center',
        }}
        onPress={() => navigation.navigate('Analytics')}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#c8c8d8', fontSize: 13, fontWeight: '600' }}>
          📊 Моя аналитика за месяц
        </Text>
        <Text style={{ color: '#ff6200', fontSize: 13 }}>→</Text>
      </TouchableOpacity>

      {/* Filters */}
      <View style={s.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.fBtn, filter === f && s.fActive]}
            onPress={() => setFilter(f)}>
            <Text style={[s.fBtnT, filter === f && s.fActiveT]}>
              {f === 'Все' ? 'Все' : f === 'NEW' ? 'Новые' : f === 'CONFIRMED' ? 'Подтверждён' : f === 'IN_PROGRESS' ? 'В работе' : 'Готов'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={shown}
        keyExtractor={o => o.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchOrders())} tintColor={Colors.ore} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyT}>Нет заказов{filter !== 'Все' ? ' с этим статусом' : ''}</Text>
          </View>
        }
        renderItem={({ item: o }) => (
          <TouchableOpacity
            style={[s.card, o.status === 'IN_PROGRESS' && s.cardActive]}
            onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}
            activeOpacity={0.8}
          >
            <View style={s.cardTop}>
              <Text style={s.cardNum}>{o.orderNumber}</Text>
              <OrderStatusBadge status={o.status} />
            </View>
            <Text style={s.cardCar}>{o.vehicle.brand} {o.vehicle.model} · {o.vehicle.year}</Text>
            <View style={s.cardBot}>
              <Text style={s.cardSpec}>{SPEC_LABELS[o.specialistType] ?? o.specialistType}</Text>
              {o.slot && (
                <Text style={s.cardTime}>
                  {new Date(o.slot.startAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            {(o as any).client && (
              <Text style={s.cardClient}>👤 {(o as any).client.name}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.void },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: Spacing.lg, paddingBottom: Spacing.md,
  },
  eye:  { fontSize: 10, color: Colors.ore, letterSpacing: 3, marginBottom: 2 },
  h1:   { fontSize: 28, fontWeight: '900', color: Colors.chalk, letterSpacing: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.greenD, borderWidth: 1, borderColor: 'rgba(61,220,104,.3)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Colors.green },
  liveT: { fontSize: 10, color: Colors.green, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  stat: {
    flex: 1, backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.sm, padding: Spacing.md, borderLeftWidth: 3,
  },
  statVal: { fontSize: 24, fontWeight: '900' },
  statL:   { fontSize: 10, color: Colors.dust, marginTop: 2 },

  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 6, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  fBtn: {
    backgroundColor: Colors.plate2, borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6,
  },
  fActive: { borderColor: Colors.ore, backgroundColor: Colors.oreD },
  fBtnT:   { fontSize: 11, fontWeight: '700', color: Colors.dust },
  fActiveT: { color: Colors.ore },

  list: { padding: Spacing.md, gap: 8, paddingBottom: 80 },
  card: {
    backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.wire,
  },
  cardActive: { borderLeftColor: Colors.ore, borderColor: Colors.ore },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardNum:    { fontSize: 17, fontWeight: '900', color: Colors.chalk },
  cardCar:    { fontSize: 13, color: Colors.ash, marginBottom: 6 },
  cardBot:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSpec:   { fontSize: 12, color: Colors.dust },
  cardTime:   { fontSize: 12, color: Colors.ore, fontWeight: '700' },
  cardClient: { fontSize: 11, color: Colors.soot, marginTop: 5 },

  empty: { alignItems: 'center', paddingTop: 64 },
  emptyT: { color: Colors.dust, fontSize: 14 },
});
