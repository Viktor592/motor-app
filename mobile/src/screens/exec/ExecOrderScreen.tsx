import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder, updateOrderStatus } from '../../store/slices/ordersSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { api } from '../../services/api';

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; color: string }> = {
  NEW:         { next: 'ASSESSED',    label: 'Оценить заказ →',      color: Colors.gold },
  ASSESSED:    { next: 'CONFIRMED',   label: 'Подтвердить →',        color: Colors.teal },
  CONFIRMED:   { next: 'IN_PROGRESS', label: '▶ Взять в работу',     color: Colors.ore },
  IN_PROGRESS: { next: 'READY',       label: '✓ Работа завершена',   color: Colors.green },
  READY:       { next: 'CLOSED',      label: '💰 Закрыть / Оплачен', color: Colors.purple },
};

export default function ExecOrderScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const dispatch    = useDispatch<AppDispatch>();
  const { current } = useSelector((s: RootState) => s.orders);
  const [updating, setUpdating] = useState(false);
  const [showAI, setShowAI]     = useState(false);

  useEffect(() => { dispatch(fetchOrder(orderId)); }, [orderId]);

  if (!current) return (
    <View style={s.loading}><ActivityIndicator color={Colors.ore} size="large" /></View>
  );

  const o = current as any;
  const transition = STATUS_TRANSITIONS[o.status];

  const changeStatus = async () => {
    if (!transition) return;
    Alert.alert('Подтвердить', `Изменить статус на "${transition.label}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Да', onPress: async () => {
          setUpdating(true);
          try {
            await api.patch(`/orders/${o.id}/status`, { status: transition.next });
            dispatch(updateOrderStatus({ orderId: o.id, status: transition.next }));
            dispatch(fetchOrder(orderId));
          } catch {
            Alert.alert('Ошибка', 'Не удалось обновить статус');
          } finally { setUpdating(false); }
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backT}>← Список заказов</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eye}>// ЗАКАЗ-НАРЯД</Text>
          <Text style={s.h1}>{o.orderNumber}</Text>
        </View>
        <OrderStatusBadge status={o.status} />
      </View>

      {/* Клиент */}
      {o.client && (
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 Клиент</Text>
          <View style={s.row}><Text style={s.rk}>Имя</Text><Text style={s.rv}>{o.client.name}</Text></View>
          <View style={s.row}><Text style={s.rk}>Телефон</Text><Text style={s.rv}>{o.client.phoneMasked}</Text></View>
        </View>
      )}

      {/* Автомобиль */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🚗 Автомобиль</Text>
        <View style={s.row}><Text style={s.rk}>Марка / Модель</Text><Text style={s.rv}>{o.vehicle?.brand} {o.vehicle?.model}</Text></View>
        <View style={s.row}><Text style={s.rk}>Год</Text><Text style={s.rv}>{o.vehicle?.year}</Text></View>
        {o.vehicle?.mileage && <View style={s.row}><Text style={s.rk}>Пробег</Text><Text style={s.rv}>{o.vehicle.mileage.toLocaleString('ru')} км</Text></View>}
      </View>

      {/* Запись */}
      {o.slot && (
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Запись</Text>
          <View style={s.row}><Text style={s.rk}>Время</Text>
            <Text style={s.rv}>{new Date(o.slot.startAt).toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={s.row}><Text style={s.rk}>Пост</Text><Text style={s.rv}>{o.slot.post?.name}</Text></View>
        </View>
      )}

      {/* Жалоба */}
      <View style={s.card}>
        <Text style={s.cardTitle}>📝 Жалоба клиента</Text>
        <Text style={s.complaint}>{o.complaintRaw}</Text>
      </View>

      {/* AI-диагностика */}
      {o.aiDiagResult && (
        <TouchableOpacity style={[s.card, s.aiCard]} onPress={() => setShowAI(true)}>
          <Text style={s.cardTitle}>🤖 AI-диагностика</Text>
          <Text style={s.aiHint}>Нажмите, чтобы увидеть гипотезы агента «Диагност» →</Text>
        </TouchableOpacity>
      )}

      {/* Позиции */}
      {o.items?.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>🔩 Позиции заказа</Text>
          {o.items.map((item: any) => (
            <View key={item.id} style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.type === 'WORK' ? '🔧' : '📦'} {item.name}</Text>
                {item.article && <Text style={s.itemArticle}>{item.article}</Text>}
              </View>
              <View style={s.itemRight}>
                <Text style={s.itemQty}>×{item.qty}</Text>
                <Text style={s.itemPrice}>{Number(item.retailPrice).toLocaleString('ru')} ₽</Text>
              </View>
            </View>
          ))}
          {o.totalRetail && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>ИТОГО</Text>
              <Text style={s.totalVal}>{Number(o.totalRetail).toLocaleString('ru')} ₽</Text>
            </View>
          )}
        </View>
      )}

      {/* Изменить статус */}
      {transition && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: transition.color + '20', borderColor: transition.color }]}
          onPress={changeStatus}
          disabled={updating}
          activeOpacity={0.8}
        >
          {updating
            ? <ActivityIndicator color={transition.color} />
            : <Text style={[s.actionBtnT, { color: transition.color }]}>{transition.label}</Text>
          }
        </TouchableOpacity>
      )}

      {/* Чат */}
      <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('Chat', { orderId: o.id })} activeOpacity={0.8}>
        <Text style={s.chatBtnT}>🤖 AI-чат по заказу</Text>
      </TouchableOpacity>

      {/* AI Modal */}
      <Modal visible={showAI} transparent animationType="slide" onRequestClose={() => setShowAI(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>🤖 Гипотезы диагноста</Text>
            <ScrollView>
              <Text style={s.modalContent}>{JSON.stringify(o.aiDiagResult, null, 2)}</Text>
            </ScrollView>
            <TouchableOpacity style={s.modalClose} onPress={() => setShowAI(false)}>
              <Text style={s.modalCloseT}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void },
  container: { padding: Spacing.lg, paddingBottom: 80 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.void },
  back:      { marginBottom: Spacing.md },
  backT:     { color: Colors.dust, fontSize: 13 },
  eye:       { fontSize: 10, color: Colors.ore, letterSpacing: 3, marginBottom: 2 },
  h1:        { fontSize: 28, fontWeight: '900', color: Colors.chalk, letterSpacing: 2, marginBottom: 4 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },

  card: { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  aiCard: { borderLeftWidth: 3, borderLeftColor: Colors.ore },
  cardTitle: { fontSize: 11, fontWeight: '700', color: Colors.dust, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,53,.4)' },
  rk: { color: Colors.dust, fontSize: 13 },
  rv: { color: Colors.chalk, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },

  complaint: { color: Colors.ash, fontSize: 14, lineHeight: 22 },
  aiHint:    { color: Colors.ore, fontSize: 12 },

  itemRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,53,.4)' },
  itemName:    { color: Colors.ash, fontSize: 13 },
  itemArticle: { color: Colors.soot, fontSize: 10, marginTop: 2 },
  itemRight:   { alignItems: 'flex-end' },
  itemQty:     { color: Colors.dust, fontSize: 11 },
  itemPrice:   { color: Colors.chalk, fontSize: 13, fontWeight: '700' },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, marginTop: 4 },
  totalLabel:  { color: Colors.dust, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  totalVal:    { color: Colors.teal, fontSize: 18, fontWeight: '900' },

  actionBtn:  { borderWidth: 2, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  actionBtnT: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  chatBtn:  { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  chatBtnT: { color: Colors.ash, fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.85)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: Colors.plate, borderTopWidth: 1, borderTopColor: Colors.wire, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: Spacing.lg, maxHeight: '70%' },
  modalTitle:   { fontSize: 18, fontWeight: '900', color: Colors.chalk, marginBottom: Spacing.md },
  modalContent: { color: Colors.ash, fontSize: 12, fontFamily: 'monospace' },
  modalClose:   { marginTop: Spacing.lg, backgroundColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  modalCloseT:  { color: '#000', fontWeight: '900', fontSize: 14 },
});
