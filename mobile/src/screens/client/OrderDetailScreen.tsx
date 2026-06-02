import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../../store/slices/ordersSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { current } = useSelector((s: RootState) => s.orders);
  useEffect(() => { dispatch(fetchOrder(orderId)); }, [orderId]);

  if (!current) return (
    <View style={s.loading}><ActivityIndicator color={Colors.ore} /></View>
  );
  const o = current as any;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backT}>← Назад</Text>
      </TouchableOpacity>

      <Text style={s.eye}>// ЗАКАЗ-НАРЯД</Text>
      <Text style={s.h1}>{o.orderNumber}</Text>
      <View style={s.statusRow}>
        <OrderStatusBadge status={o.status} />
        <Text style={s.date}>{new Date(o.createdAt).toLocaleDateString('ru')}</Text>
      </View>

      {/* Авто */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🚗 Автомобиль</Text>
        <View style={s.row}><Text style={s.rk}>Марка / Модель</Text><Text style={s.rv}>{o.vehicle?.brand} {o.vehicle?.model}</Text></View>
        <View style={s.row}><Text style={s.rk}>Год</Text><Text style={s.rv}>{o.vehicle?.year}</Text></View>
      </View>

      {/* Запись */}
      {o.slot && (
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Запись</Text>
          <View style={s.row}><Text style={s.rk}>Дата и время</Text>
            <Text style={s.rv}>{new Date(o.slot.startAt).toLocaleString('ru',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</Text>
          </View>
          <View style={s.row}><Text style={s.rk}>Пост</Text><Text style={s.rv}>{o.slot.post?.name}</Text></View>
        </View>
      )}

      {/* Жалоба */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📝 Проблема</Text>
        <Text style={s.complaint}>{o.complaintRaw}</Text>
      </View>

      {/* Смета */}
      {o.totalRetail && (
        <View style={[s.card, s.priceCard]}>
          <Text style={s.cardTitle}>💰 Смета</Text>
          <Text style={s.price}>{Number(o.totalRetail).toLocaleString('ru')} ₽</Text>
        </View>
      )}

      {/* AI-диагностика */}
      <TouchableOpacity style={[s.chatBtn,{borderColor:Colors.ore,marginBottom:8}]} onPress={() => navigation.navigate('Diagnostics', { orderId: o.id })} activeOpacity={.8}>
        <Text style={[s.chatBtnT,{color:Colors.ore}]}>🤖 AI-диагностика и смета</Text>
      </TouchableOpacity>
      {/* AI-чат */}
      <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('Chat', { orderId: o.id })} activeOpacity={.8}>
        <Text style={s.chatBtnT}>💬 AI-чат по заказу</Text>
      </TouchableOpacity>
      {/* PDF */}
      <TouchableOpacity style={[s.chatBtn,{marginTop:8}]} onPress={() => Linking.openURL(API_URL.replace('/api/v1','') + '/api/v1/export/orders/' + o.id + '/pdf')} activeOpacity={.8}>
        <Text style={s.chatBtnT}>📄 Скачать PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.void},
  container:{padding:Spacing.lg,paddingBottom:80},
  loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:Colors.void},
  back:{marginBottom:Spacing.md},
  backT:{color:Colors.dust,fontSize:13},
  eye:{fontSize:10,color:Colors.ore,letterSpacing:3,marginBottom:4},
  h1:{fontWeight:'900',fontSize:30,color:Colors.chalk,letterSpacing:2,marginBottom:Spacing.sm},
  statusRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:Spacing.lg},
  date:{color:Colors.dust,fontSize:12},
  card:{backgroundColor:Colors.plate,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.md,padding:Spacing.md,marginBottom:Spacing.md},
  cardTitle:{fontSize:11,fontWeight:'700',color:Colors.dust,textTransform:'uppercase',letterSpacing:1,marginBottom:10},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:5,borderBottomWidth:1,borderBottomColor:'rgba(42,42,53,.4)'},
  rk:{color:Colors.dust,fontSize:13},
  rv:{color:Colors.chalk,fontSize:13,fontWeight:'600'},
  complaint:{color:Colors.ash,fontSize:14,lineHeight:22},
  priceCard:{borderLeftWidth:3,borderLeftColor:Colors.teal},
  price:{color:Colors.teal,fontSize:28,fontWeight:'900'},
  chatBtn:{backgroundColor:Colors.plate,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,padding:Spacing.md,alignItems:'center',marginTop:Spacing.sm},
  chatBtnT:{color:Colors.ash,fontSize:14,fontWeight:'600'},
});
