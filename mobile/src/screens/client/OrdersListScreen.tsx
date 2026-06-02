import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';

export default function OrdersListScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading } = useSelector((s: RootState) => s.orders);
  const [search, setSearch] = React.useState('');
  useEffect(() => { dispatch(fetchOrders()); }, []);
  const shown = search
    ? list.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
        o.vehicle.model.toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.h1}>МОИ ЗАКАЗЫ</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('Booking')}>
          <Text style={s.newBtnT}>+ Запись</Text>
        </TouchableOpacity>
      </View>
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по номеру, марке…"
          placeholderTextColor={Colors.dust}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={shown}
        keyExtractor={o => o.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchOrders())} tintColor={Colors.ore} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyT}>Нет заказов</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Booking')}><Text style={s.emptyL}>Записаться →</Text></TouchableOpacity>
          </View>
        }
        renderItem={({ item: o }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })} activeOpacity={.8}>
            <View style={s.cardTop}>
              <Text style={s.num}>{o.orderNumber}</Text>
              <OrderStatusBadge status={o.status} />
            </View>
            <Text style={s.car}>{o.vehicle.brand} {o.vehicle.model} · {o.vehicle.year}</Text>
            {o.slot && <Text style={s.slot}>📅 {new Date(o.slot.startAt).toLocaleDateString('ru', { day:'2-digit', month:'short' })}</Text>}
            {o.totalRetail && <Text style={s.price}>{Number(o.totalRetail).toLocaleString('ru')} ₽</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.void},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:Spacing.lg,borderBottomWidth:1,borderBottomColor:Colors.wire},
  h1:{fontWeight:'900',fontSize:24,color:Colors.chalk,letterSpacing:2},
  newBtn:{backgroundColor:Colors.ore,borderRadius:Radius.sm,paddingHorizontal:14,paddingVertical:7},
  newBtnT:{color:'#000',fontSize:12,fontWeight:'900'},
  list:{padding:Spacing.md,gap:8,paddingBottom:80},
  card:{backgroundColor:Colors.plate,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.md,padding:Spacing.md,borderLeftWidth:3,borderLeftColor:Colors.ore},
  cardTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:5},
  num:{fontSize:17,fontWeight:'900',color:Colors.chalk},
  car:{fontSize:13,color:Colors.ash,marginBottom:3},
  slot:{fontSize:12,color:Colors.dust},
  price:{fontSize:12,color:Colors.teal,fontWeight:'700',marginTop:3},
  searchWrap:{paddingHorizontal:Spacing.md,paddingBottom:8,borderBottomWidth:1,borderBottomColor:Colors.wire},
  search:{backgroundColor:Colors.plate2,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,padding:Spacing.sm,paddingHorizontal:Spacing.md,color:Colors.chalk,fontSize:14},
  empty:{alignItems:'center',paddingTop:80},
  emptyT:{color:Colors.dust,fontSize:15},
  emptyL:{color:Colors.ore,fontSize:13,marginTop:10},
});
