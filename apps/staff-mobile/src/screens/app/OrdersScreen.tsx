import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../services/api';

const STATUS_LABEL: Record<string, string> = {
  NEW:'Новый', ASSESSED:'Оценён', CONFIRMED:'Подтверждён',
  IN_PROGRESS:'В работе', READY:'Готов', CLOSED:'Закрыт',
};
const STATUS_COLOR: Record<string, string> = {
  NEW:'#3db8ff', ASSESSED:'#ffc600', CONFIRMED:'#ffc600',
  IN_PROGRESS:'#ff6200', READY:'#3ddc68', CLOSED:'#6a6a80',
};
const NEXT: Record<string, string> = {
  CONFIRMED:'IN_PROGRESS', IN_PROGRESS:'READY',
};

export default function OrdersScreen() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/orders/exec').then(r => setOrders(r.data.orders ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const advance = async (id: string, next: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: next });
      load();
    } catch { Alert.alert('Ошибка', 'Не удалось обновить статус'); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#00e5c4" /></View>;

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Мои заказы</Text>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item: o }) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.num}>{o.orderNumber}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[o.status]+'22', borderColor: STATUS_COLOR[o.status] }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[o.status] }]}>{STATUS_LABEL[o.status]}</Text>
              </View>
            </View>
            <Text style={s.complaint} numberOfLines={2}>{o.complaintRaw}</Text>
            {o.vehicle && <Text style={s.meta}>{o.vehicle.brand} {o.vehicle.model} · {o.vehicle.plateNum ?? '—'}</Text>}
            {o.client  && <Text style={s.meta}>👤 {o.client.name} · {o.client.phone}</Text>}
            {NEXT[o.status] && (
              <TouchableOpacity style={s.nextBtn} onPress={() => advance(o.id, NEXT[o.status])}>
                <Text style={s.nextBtnText}>
                  {NEXT[o.status] === 'IN_PROGRESS' ? '▶ Взять в работу' : '✓ Готово'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Нет активных заказов</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flex:1, backgroundColor:'#060608', padding:16 },
  center:     { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#060608' },
  title:      { color:'#f0f0f5', fontSize:22, fontWeight:'bold', marginBottom:16, marginTop:8 },
  card:       { backgroundColor:'#111115', borderRadius:12, padding:16, marginBottom:10, borderWidth:1, borderColor:'#1e1e25' },
  row:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  num:        { color:'#00e5c4', fontWeight:'bold', fontSize:14 },
  badge:      { borderRadius:6, paddingHorizontal:8, paddingVertical:3, borderWidth:1 },
  badgeText:  { fontSize:11, fontWeight:'600' },
  complaint:  { color:'#c8c8d8', fontSize:13, marginBottom:6 },
  meta:       { color:'#6a6a80', fontSize:12, marginBottom:2 },
  nextBtn:    { backgroundColor:'#00e5c4', borderRadius:8, padding:10, alignItems:'center', marginTop:10 },
  nextBtnText:{ color:'#060608', fontWeight:'bold', fontSize:13 },
  empty:      { color:'#6a6a80', textAlign:'center', marginTop:40, fontSize:15 },
});
