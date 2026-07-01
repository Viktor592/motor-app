import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../../services/api';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Новый', ASSESSED: 'Оценён', CONFIRMED: 'Подтверждён',
  IN_PROGRESS: 'В работе', READY: 'Готов', CLOSED: 'Закрыт', CANCELLED: 'Отменён',
};
const STATUS_COLOR: Record<string, string> = {
  NEW: '#3db8ff', ASSESSED: '#ffc600', CONFIRMED: '#ffc600',
  IN_PROGRESS: '#ff6200', READY: '#3ddc68', CLOSED: '#6a6a80', CANCELLED: '#ff3b3b',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data.orders ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#ff6200" /></View>;

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
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[o.status] + '22', borderColor: STATUS_COLOR[o.status] }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[o.status] }]}>{STATUS_LABEL[o.status]}</Text>
              </View>
            </View>
            <Text style={s.complaint} numberOfLines={2}>{o.complaintRaw}</Text>
            {o.vehicle && <Text style={s.vehicle}>{o.vehicle.brand} {o.vehicle.model} {o.vehicle.year}</Text>}
            {o.totalRetail && <Text style={s.price}>{Number(o.totalRetail).toLocaleString('ru')} ₽</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Заказов пока нет</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flex:1, backgroundColor:'#060608', padding:16 },
  center:     { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#060608' },
  title:      { color:'#f0f0f5', fontSize:22, fontWeight:'bold', marginBottom:16, marginTop:8 },
  card:       { backgroundColor:'#111115', borderRadius:12, padding:16, marginBottom:10,
                borderWidth:1, borderColor:'#1e1e25' },
  row:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  num:        { color:'#ff6200', fontWeight:'bold', fontSize:14 },
  badge:      { borderRadius:6, paddingHorizontal:8, paddingVertical:3, borderWidth:1 },
  badgeText:  { fontSize:11, fontWeight:'600' },
  complaint:  { color:'#c8c8d8', fontSize:13, marginBottom:6 },
  vehicle:    { color:'#6a6a80', fontSize:12 },
  price:      { color:'#3ddc68', fontSize:15, fontWeight:'bold', marginTop:6 },
  empty:      { color:'#6a6a80', textAlign:'center', marginTop:40, fontSize:15 },
});
