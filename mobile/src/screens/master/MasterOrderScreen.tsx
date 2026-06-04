/**
 * MasterOrderScreen — экран работы мастера с заказом
 * Смена статуса, добавление работ/запчастей, фото
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { Colors } from '../../theme';

interface OrderItem {
  id: string; type: 'WORK' | 'PART';
  name: string; qty: number;
  retailPrice: number; costPrice: number | null;
}
interface Order {
  id: string; orderNumber: string; status: string;
  specialistType: string; complaint: string | null; diagnosis: string | null;
  vehicle: { make: string; model: string; year: number; plate: string; vin: string | null };
  client: { name: string; phone: string };
  items: OrderItem[];
  totalRetail: number | null;
  createdAt: string;
}

const STATUSES = [
  { key: 'PENDING',        label: 'Ожидает',        color: '#d97706' },
  { key: 'IN_PROGRESS',   label: 'В работе',        color: '#2563eb' },
  { key: 'WAITING_PARTS', label: 'Ждёт запчасти',   color: '#7c3aed' },
  { key: 'QUALITY_CHECK', label: 'Проверка качества', color: '#0891b2' },
  { key: 'DONE',          label: 'Готов',            color: '#16a34a' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function MasterOrderScreen() {
  const route      = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params;

  const [order, setOrder]       = useState<Order | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Форма добавления позиции
  const [showForm, setShowForm]     = useState(false);
  const [itemType, setItemType]     = useState<'WORK' | 'PART'>('WORK');
  const [itemName, setItemName]     = useState('');
  const [itemQty, setItemQty]       = useState('1');
  const [itemPrice, setItemPrice]   = useState('');
  const [saving, setSaving]         = useState(false);

  // Диагноз
  const [diagnosis, setDiagnosis]   = useState('');
  const [savingDiag, setSavingDiag] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/orders/${orderId}`);
      setOrder(data);
      setDiagnosis(data.diagnosis ?? '');
    } catch (e) { console.warn('[MasterOrder]', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status: string) => {
    Alert.alert(
      'Сменить статус?',
      `Статус: ${STATUSES.find(s => s.key === status)?.label}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Да', onPress: async () => {
            await api.patch(`/orders/${orderId}/status`, { status });
            load();
          },
        },
      ],
    );
  };

  const addItem = async () => {
    if (!itemName || !itemPrice) return;
    setSaving(true);
    try {
      await api.post(`/orders/${orderId}/items`, {
        type:        itemType,
        name:        itemName,
        qty:         parseFloat(itemQty),
        retailPrice: parseFloat(itemPrice),
      });
      setItemName(''); setItemQty('1'); setItemPrice('');
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const removeItem = (itemId: string) => {
    Alert.alert('Удалить позицию?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await api.delete(`/orders/${orderId}/items/${itemId}`);
        load();
      }},
    ]);
  };

  const saveDiagnosis = async () => {
    setSavingDiag(true);
    try {
      await api.patch(`/orders/${orderId}`, { diagnosis });
      Alert.alert('✅ Диагноз сохранён');
    } finally { setSavingDiag(false); }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={Colors.ore} /></View>
  );
  if (!order) return (
    <View style={s.center}><Text style={s.errorText}>Заказ не найден</Text></View>
  );

  const currentStatusIdx = STATUSES.findIndex(st => st.key === order.status);
  const totalRetail = order.items.reduce((sum, i) => sum + i.retailPrice * i.qty, 0);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.ore} />}
    >
      {/* Шапка */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={s.orderNum}>Заказ #{order.orderNumber}</Text>
      </View>

      {/* Автомобиль и клиент */}
      <View style={s.card}>
        <Text style={s.cardTitle}>🚗 {order.vehicle.make} {order.vehicle.model} {order.vehicle.year}</Text>
        <Text style={s.cardSub}>Гос. № {order.vehicle.plate}{order.vehicle.vin ? ` · VIN: ${order.vehicle.vin}` : ''}</Text>
        <View style={s.divider} />
        <Text style={s.cardTitle}>👤 {order.client.name}</Text>
        <Text style={s.cardSub}>{order.client.phone}</Text>
        {order.complaint && (
          <>
            <View style={s.divider} />
            <Text style={s.label}>Жалоба клиента</Text>
            <Text style={s.valueText}>{order.complaint}</Text>
          </>
        )}
      </View>

      {/* Статус — пайплайн */}
      <Text style={s.sectionTitle}>Статус заказа</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statusScroll}>
        <View style={s.statusRow}>
          {STATUSES.map((st, idx) => {
            const isActive  = st.key === order.status;
            const isDone    = idx < currentStatusIdx;
            return (
              <TouchableOpacity
                key={st.key}
                style={[s.statusStep, isActive && { borderColor: st.color, backgroundColor: st.color + '22' }]}
                onPress={() => changeStatus(st.key)}
              >
                <View style={[s.stepDot, { backgroundColor: isActive ? st.color : isDone ? '#16a34a' : Colors.wire }]} />
                <Text style={[s.stepLabel, isActive && { color: st.color, fontWeight: '700' }]}>{st.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Диагноз */}
      <Text style={s.sectionTitle}>Диагноз / описание работ</Text>
      <View style={s.card}>
        <TextInput
          style={s.diagInput}
          multiline
          numberOfLines={4}
          placeholder="Опишите диагноз и выполненные работы…"
          placeholderTextColor={Colors.dust}
          value={diagnosis}
          onChangeText={setDiagnosis}
        />
        <TouchableOpacity style={s.btnSave} onPress={saveDiagnosis} disabled={savingDiag}>
          <Text style={s.btnSaveText}>{savingDiag ? 'Сохраняю…' : '💾 Сохранить диагноз'}</Text>
        </TouchableOpacity>
      </View>

      {/* Позиции заказа */}
      <View style={s.itemsHeader}>
        <Text style={s.sectionTitle}>Работы и запчасти</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(v => !v)}>
          <Text style={s.addBtnText}>{showForm ? '✕ Закрыть' : '+ Добавить'}</Text>
        </TouchableOpacity>
      </View>

      {/* Форма добавления */}
      {showForm && (
        <View style={s.card}>
          <View style={s.typeRow}>
            {(['WORK', 'PART'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.typeBtn, itemType === t && s.typeBtnActive]}
                onPress={() => setItemType(t)}
              >
                <Text style={[s.typeBtnText, itemType === t && s.typeBtnTextActive]}>
                  {t === 'WORK' ? '🔧 Работа' : '🔩 Запчасть'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} placeholder="Наименование…" placeholderTextColor={Colors.dust}
            value={itemName} onChangeText={setItemName} />
          <View style={s.row}>
            <TextInput style={[s.input, s.inputHalf]} placeholder="Кол-во" placeholderTextColor={Colors.dust}
              keyboardType="numeric" value={itemQty} onChangeText={setItemQty} />
            <TextInput style={[s.input, s.inputHalf]} placeholder="Цена ₽" placeholderTextColor={Colors.dust}
              keyboardType="numeric" value={itemPrice} onChangeText={setItemPrice} />
          </View>
          <TouchableOpacity style={s.btnPrimary} onPress={addItem} disabled={saving}>
            <Text style={s.btnPrimaryText}>{saving ? 'Добавляю…' : '✅ Добавить'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Список позиций */}
      {order.items.map(item => (
        <View key={item.id} style={s.itemRow}>
          <Text style={s.itemIcon}>{item.type === 'WORK' ? '🔧' : '🔩'}</Text>
          <View style={s.itemInfo}>
            <Text style={s.itemName}>{item.name}</Text>
            <Text style={s.itemSub}>{item.qty} × {fmt(item.retailPrice)}</Text>
          </View>
          <Text style={s.itemTotal}>{fmt(item.qty * item.retailPrice)}</Text>
          <TouchableOpacity onPress={() => removeItem(item.id)} style={s.removeBtn}>
            <Text style={s.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Итого */}
      {order.items.length > 0 && (
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Итого</Text>
          <Text style={s.totalValue}>{fmt(totalRetail)}</Text>
        </View>
      )}

      {/* Завершить заказ */}
      {order.status === 'DONE' && (
        <TouchableOpacity style={s.btnClose} onPress={() => changeStatus('CLOSED')}>
          <Text style={s.btnCloseText}>🏁 Закрыть заказ</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.void },
  content: { padding: 16, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.void },
  errorText: { color: Colors.dust, fontSize: 16 },

  header:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn:  { paddingVertical: 4, paddingRight: 8 },
  backText: { color: Colors.ore, fontSize: 15 },
  orderNum: { fontSize: 18, fontWeight: '800', color: Colors.chalk },

  card:     { backgroundColor: Colors.plate, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.wire },
  cardTitle:{ fontSize: 15, fontWeight: '700', color: Colors.chalk },
  cardSub:  { fontSize: 13, color: Colors.dust, marginTop: 2 },
  divider:  { height: 1, backgroundColor: Colors.wire, marginVertical: 10 },
  label:    { fontSize: 11, color: Colors.dust, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  valueText:{ fontSize: 14, color: Colors.chalk },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.chalk, marginBottom: 10 },

  statusScroll: { marginBottom: 16 },
  statusRow:    { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  statusStep:   { alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.wire, minWidth: 90 },
  stepDot:      { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  stepLabel:    { fontSize: 11, color: Colors.dust, textAlign: 'center' },

  diagInput: { color: Colors.chalk, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  btnSave:   { backgroundColor: Colors.ore + '22', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.ore },
  btnSaveText: { color: Colors.ore, fontWeight: '700', fontSize: 14 },

  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn:      { backgroundColor: Colors.ore, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  typeRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn:     { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.wire, alignItems: 'center' },
  typeBtnActive: { borderColor: Colors.ore, backgroundColor: Colors.ore + '22' },
  typeBtnText: { color: Colors.dust, fontSize: 13, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.ore },

  input:     { backgroundColor: Colors.void, borderRadius: 8, padding: 10, color: Colors.chalk, borderWidth: 1, borderColor: Colors.wire, marginBottom: 10, fontSize: 14 },
  inputHalf: { flex: 1 },
  row:       { flexDirection: 'row', gap: 8 },

  btnPrimary:     { backgroundColor: Colors.ore, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  itemRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.plate, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.wire, gap: 10 },
  itemIcon:  { fontSize: 18 },
  itemInfo:  { flex: 1 },
  itemName:  { fontSize: 14, color: Colors.chalk, fontWeight: '600' },
  itemSub:   { fontSize: 12, color: Colors.dust },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Colors.ore },
  removeBtn: { padding: 4 },
  removeText:{ color: '#dc2626', fontSize: 16, fontWeight: '700' },

  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: Colors.plate, borderRadius: 10, marginTop: 4, marginBottom: 16, borderWidth: 1, borderColor: Colors.ore },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.chalk },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.ore },

  btnClose:     { backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnCloseText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
