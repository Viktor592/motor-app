import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateName } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { api } from '../../services/api';
import { Colors, Spacing, Radius } from '../../theme';

interface Vehicle {
  id: string; brand: string; model: string; year: number;
  mileage?: number; plateNum?: string;
}

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { name, role, phone } = useSelector((s: RootState) => s.auth);

  const [vehicles,    setVehicles]   = useState<Vehicle[]>([]);
  const [loadingV,    setLoadingV]   = useState(false);
  const [showModal,   setShowModal]  = useState(false);
  const [editName,    setEditName]   = useState(name ?? '');
  const [savingName,  setSavingName] = useState(false);

  // Новый авто
  const [brand,    setBrand]   = useState('');
  const [model,    setModel]   = useState('');
  const [year,     setYear]    = useState('');
  const [mileage,  setMileage] = useState('');
  const [plate,    setPlate]   = useState('');
  const [addingV,  setAddingV] = useState(false);

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    setLoadingV(true);
    try {
      const r = await api.get('/auth/me');
      setVehicles(r.data.vehicles ?? []);
    } catch {}
    finally { setLoadingV(false); }
  };

  const saveName = async () => {
    if (editName.trim().length < 2) return;
    setSavingName(true);
    await dispatch(updateName(editName.trim()));
    setSavingName(false);
  };

  const addVehicle = async () => {
    if (!brand || !model || !year) { Alert.alert('Ошибка', 'Заполните марку, модель и год'); return; }
    setAddingV(true);
    try {
      await api.post('/users/vehicles', {
        brand, model,
        year:    parseInt(year),
        mileage: mileage ? parseInt(mileage) : undefined,
        plateNum: plate || undefined,
      });
      setBrand(''); setModel(''); setYear(''); setMileage(''); setPlate('');
      setShowModal(false);
      fetchVehicles();
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.error ?? 'Не удалось добавить');
    }
    finally { setAddingV(false); }
  };

  const deleteVehicle = (id: string, label: string) => {
    Alert.alert('Удалить автомобиль?', label, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/users/vehicles/${id}`);
          setVehicles(prev => prev.filter(v => v.id !== id));
        } catch { Alert.alert('Ошибка', 'Не удалось удалить'); }
      }},
    ]);
  };

  const ROLE_LABEL: Record<string, string> = {
    CLIENT: 'Клиент', MASTER: 'Мастер', RECEPTIONIST: 'Приёмщик', ADMIN: 'Администратор',
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      {/* Шапка */}
      <View style={s.hero}>
        <View style={s.ava}><Text style={s.avaT}>{name?.[0] ?? '?'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.roleT}>{ROLE_LABEL[role ?? ''] ?? role}</Text>
          {phone && <Text style={s.phone}>{phone}</Text>}
        </View>
      </View>

      {/* Редактировать имя */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>ИМЯ</Text>
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Ваше имя"
            placeholderTextColor={Colors.dust}
          />
          <TouchableOpacity
            style={[s.saveBtn, (savingName || editName === name) && s.saveBtnD]}
            onPress={saveName}
            disabled={savingName || editName === name}
            activeOpacity={0.8}
          >
            {savingName ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveBtnT}>✓</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Автомобили — только для клиентов */}
      {role === 'CLIENT' && (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>МОИ АВТОМОБИЛИ</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
              <Text style={s.addBtnT}>+ Добавить</Text>
            </TouchableOpacity>
          </View>

          {loadingV && <ActivityIndicator color={Colors.ore} style={{ marginTop: 12 }} />}

          {!loadingV && vehicles.length === 0 && (
            <View style={s.emptyCard}>
              <Text style={s.emptyT}>Нет автомобилей</Text>
              <Text style={s.emptySub}>Добавьте автомобиль, чтобы ускорить запись</Text>
            </View>
          )}

          {vehicles.map(v => (
            <View key={v.id} style={s.vehicleCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.vehicleName}>{v.brand} {v.model}</Text>
                <View style={s.vehicleMeta}>
                  <Text style={s.vehicleTag}>{v.year}</Text>
                  {v.mileage && <Text style={s.vehicleTag}>{v.mileage.toLocaleString('ru')} км</Text>}
                  {v.plateNum && <Text style={s.vehicleTag}>{v.plateNum}</Text>}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => deleteVehicle(v.id, `${v.brand} ${v.model} ${v.year}`)}
                style={s.delBtn}
              >
                <Text style={s.delBtnT}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Версия */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>О ПРИЛОЖЕНИИ</Text>
        <View style={s.infoCard}>
          <View style={s.infoRow}><Text style={s.infoK}>Версия</Text><Text style={s.infoV}>1.0.0</Text></View>
          <View style={s.infoRow}><Text style={s.infoK}>AI-движок</Text><Text style={s.infoV}>Claude Sonnet 4.6</Text></View>
          <View style={s.infoRow}><Text style={s.infoK}>Разработчик</Text><Text style={s.infoV}>МОТОР-СИСТЕМА</Text></View>
        </View>
      </View>

      {/* Выйти */}
      <TouchableOpacity style={s.logoutBtn} onPress={() => dispatch(logout())} activeOpacity={0.8}>
        <Text style={s.logoutT}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      {/* Модалка — добавить авто */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Добавить автомобиль</Text>
            {[
              { label: 'МАРКА',   val: brand,   set: setBrand,   ph: 'Toyota',   kb: 'default' },
              { label: 'МОДЕЛЬ',  val: model,   set: setModel,   ph: 'Camry',    kb: 'default' },
              { label: 'ГОД',     val: year,    set: setYear,    ph: '2021',     kb: 'number-pad' },
              { label: 'ПРОБЕГ',  val: mileage, set: setMileage, ph: '50000',    kb: 'number-pad' },
              { label: 'НОМЕР',   val: plate,   set: setPlate,   ph: 'А123ВС799', kb: 'default' },
            ].map(f => (
              <View key={f.label} style={s.field}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={f.val}
                  onChangeText={f.set as any}
                  placeholder={f.ph}
                  placeholderTextColor={Colors.dust}
                  keyboardType={f.kb as any}
                />
              </View>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelT}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.confirmBtn, addingV && s.saveBtnD]} onPress={addVehicle} disabled={addingV}>
                {addingV ? <ActivityIndicator color="#000" /> : <Text style={s.confirmT}>Добавить</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void },
  container: { padding: Spacing.lg, paddingBottom: 80 },

  hero:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.ore },
  ava:   { width: 52, height: 52, borderRadius: 99, backgroundColor: Colors.ore, alignItems: 'center', justifyContent: 'center' },
  avaT:  { color: '#000', fontSize: 22, fontWeight: '900' },
  name:  { color: Colors.chalk, fontSize: 18, fontWeight: '800' },
  roleT: { color: Colors.ore, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },
  phone: { color: Colors.dust, fontSize: 12, marginTop: 2 },

  section:     { marginBottom: Spacing.lg },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle:{ color: Colors.soot, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm },

  row:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input:   { backgroundColor: Colors.plate2, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, color: Colors.chalk, fontSize: 14 },
  saveBtn: { backgroundColor: Colors.green, width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  saveBtnD:{ opacity: 0.4 },
  saveBtnT:{ color: '#000', fontSize: 18, fontWeight: '900' },

  addBtn:  { backgroundColor: Colors.oreD, borderWidth: 1, borderColor: Colors.ore, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnT: { color: Colors.ore, fontSize: 12, fontWeight: '700' },

  emptyCard: { backgroundColor: Colors.plate2, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center' },
  emptyT:    { color: Colors.dust, fontSize: 14, marginBottom: 4 },
  emptySub:  { color: Colors.soot, fontSize: 11, textAlign: 'center' },

  vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: Colors.wire },
  vehicleName: { color: Colors.chalk, fontSize: 15, fontWeight: '700' },
  vehicleMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  vehicleTag:  { color: Colors.dust, fontSize: 11, backgroundColor: Colors.cage, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3 },
  delBtn:      { padding: 8 },
  delBtnT:     { color: Colors.soot, fontSize: 16 },

  infoCard:  { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,53,.4)' },
  infoK:     { color: Colors.dust, fontSize: 13 },
  infoV:     { color: Colors.chalk, fontSize: 13, fontWeight: '600' },

  logoutBtn: { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  logoutT:   { color: Colors.dust, fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.85)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: Colors.plate, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, borderTopColor: Colors.wire, padding: Spacing.lg, paddingBottom: 40 },
  modalTitle:   { color: Colors.chalk, fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: Spacing.lg },
  field:        { marginBottom: Spacing.sm },
  fieldLabel:   { color: Colors.dust, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 5 },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  cancelBtn:    { flex: 1, backgroundColor: Colors.plate2, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  cancelT:      { color: Colors.dust, fontSize: 14, fontWeight: '600' },
  confirmBtn:   { flex: 2, backgroundColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  confirmT:     { color: '#000', fontSize: 14, fontWeight: '900' },
});
