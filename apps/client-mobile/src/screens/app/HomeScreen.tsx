import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { api } from '../../services/api';

interface Props { onLogout: () => void; }

export default function HomeScreen({ onLogout }: Props) {
  const [stats, setStats] = useState({ orders: 0, active: 0 });

  useEffect(() => {
    api.get('/orders?limit=5').then(r => {
      const orders = r.data.orders ?? [];
      setStats({ orders: orders.length, active: orders.filter((o: any) => o.status === 'IN_PROGRESS').length });
    }).catch(() => {});
  }, []);

  return (
    <ScrollView style={s.wrap}>
      <Text style={s.hello}>⬡ МОТОР</Text>
      <Text style={s.sub}>Добро пожаловать</Text>

      <View style={s.cards}>
        <View style={s.card}>
          <Text style={s.cardVal}>{stats.orders}</Text>
          <Text style={s.cardLabel}>Всего заказов</Text>
        </View>
        <View style={[s.card, { borderColor: '#ff6200' }]}>
          <Text style={[s.cardVal, { color: '#ff6200' }]}>{stats.active}</Text>
          <Text style={s.cardLabel}>В работе</Text>
        </View>
      </View>

      <TouchableOpacity style={s.btn}>
        <Text style={s.btnText}>📅 Записаться на сервис</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, s.btnOutline]}>
        <Text style={s.btnOutlineText}>📋 Мои заказы</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, s.btnDanger]} onPress={onLogout}>
        <Text style={s.btnText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:         { flex:1, backgroundColor:'#060608', padding:24 },
  hello:        { color:'#ff6200', fontSize:28, fontWeight:'bold', marginTop:40 },
  sub:          { color:'#6a6a80', fontSize:14, marginBottom:32 },
  cards:        { flexDirection:'row', gap:12, marginBottom:24 },
  card:         { flex:1, backgroundColor:'#16161b', borderRadius:12, padding:16,
                  borderWidth:1, borderColor:'#2a2a35' },
  cardVal:      { color:'#f0f0f5', fontSize:28, fontWeight:'bold' },
  cardLabel:    { color:'#6a6a80', fontSize:12, marginTop:4 },
  btn:          { backgroundColor:'#ff6200', borderRadius:10, padding:16,
                  alignItems:'center', marginBottom:12 },
  btnText:      { color:'#fff', fontWeight:'bold', fontSize:15 },
  btnOutline:   { backgroundColor:'transparent', borderWidth:1, borderColor:'#2a2a35' },
  btnOutlineText:{ color:'#c8c8d8', fontWeight:'bold', fontSize:15 },
  btnDanger:    { backgroundColor:'#1e1e25', marginTop:16 },
});
