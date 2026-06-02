import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { api } from '../../services/api';
import { getSocket, joinOrder, leaveOrder } from '../../services/socket';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';

interface Step { step: number; name: string; status: 'waiting'|'running'|'done'|'error'; data?: any; }
const STEPS_INIT: Step[] = [
  { step: 1, name: 'Приёмщик',  status: 'waiting' },
  { step: 2, name: 'Диагност',  status: 'waiting' },
  { step: 3, name: 'Оценщик',   status: 'waiting' },
];

const URGENCY_COLOR: Record<string, string> = {
  critical: Colors.red, high: Colors.ore, medium: Colors.gold, low: Colors.green,
};

export default function DiagnosticsScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order,   setOrder]   = useState<any>(null);
  const [steps,   setSteps]   = useState<Step[]>(STEPS_INIT);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'diag'|'items'>('diag');
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.linear })).start();
  }, []);

  useEffect(() => {
    api.get(`/pipeline/${orderId}/status`)
      .then(r => {
        setOrder(r.data);
        if (r.data.aiDiagResult) setSteps(STEPS_INIT.map(s => ({ ...s, status: 'done' })));
      })
      .finally(() => setLoading(false));

    joinOrder(orderId);
    const socket = getSocket();
    socket?.on('pipeline:step', (e: any) => {
      setSteps(prev => prev.map(s =>
        s.step === e.step ? { ...s, status: e.status, data: e.data } :
        s.step === e.step + 1 ? { ...s, status: 'running' } : s
      ));
      if (e.step === 3 && e.status === 'done') {
        api.get(`/pipeline/${orderId}/status`).then(r => setOrder(r.data));
        setRunning(false);
      }
    });
    socket?.on('pipeline:error', () => {
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      setRunning(false);
    });
    return () => { leaveOrder(orderId); socket?.off('pipeline:step'); socket?.off('pipeline:error'); };
  }, [orderId]);

  const runPipeline = async () => {
    if (running) return;
    setRunning(true);
    setSteps(STEPS_INIT.map((s, i) => ({ ...s, status: i === 0 ? 'running' : 'waiting' })));
    try {
      await api.post(`/pipeline/${orderId}/run`);
    } catch (e: any) {
      setRunning(false);
      Alert.alert('Ошибка', e.response?.data?.error ?? 'Не удалось запустить');
    }
  };

  const startPayment = async () => {
    Alert.alert('Оплата', 'Для оплаты откройте веб-версию МОТОР или обратитесь на ресепшн.', [{ text: 'OK' }]);
  };

  if (loading) return <View style={s.loading}><ActivityIndicator color={Colors.ore} size="large" /></View>;
  if (!order)  return <View style={s.loading}><Text style={s.loadingT}>Заказ не найден</Text></View>;

  const diag   = order.aiDiagResult;
  const parsed = order.complaintParsed;
  const spin   = spinAnim.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] });

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backT}>← {order.orderNumber}</Text>
      </TouchableOpacity>

      <Text style={s.eye}>// AI-ДИАГНОСТИКА</Text>
      <Text style={s.h1}>{order.vehicle?.brand} {order.vehicle?.model}</Text>

      {/* Pipeline steps */}
      <View style={s.pipeline}>
        {steps.map((step, i) => (
          <View key={step.step} style={s.stepRow}>
            <View style={[s.stepCircle,
              step.status === 'done'    && s.stepDone,
              step.status === 'running' && s.stepRunning,
              step.status === 'error'   && s.stepError,
            ]}>
              {step.status === 'running' ? (
                <Animated.Text style={[s.stepNum, { transform: [{ rotate: spin }] }]}>◌</Animated.Text>
              ) : (
                <Text style={s.stepNum}>
                  {step.status === 'done' ? '✓' : step.status === 'error' ? '✕' : step.step}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepName}>Агент «{step.name}»</Text>
              {step.status === 'running' && <Text style={s.stepRunningT}>Обрабатывает…</Text>}
              {step.status === 'done' && step.data && (
                <Text style={s.stepDoneT}>
                  {Object.values(step.data).slice(0, 2).join(' · ')}
                </Text>
              )}
            </View>
            {i < steps.length - 1 && <Text style={s.stepArrow}>›</Text>}
          </View>
        ))}
      </View>

      {/* Run button */}
      {!diag && (
        <TouchableOpacity style={[s.runBtn, running && s.runBtnD]} onPress={runPipeline} disabled={running} activeOpacity={.8}>
          <Text style={s.runBtnT}>{running ? '⏳ Агенты работают…' : '🚀 Запустить AI-диагностику'}</Text>
        </TouchableOpacity>
      )}

      {/* Results */}
      {diag && (
        <>
          {/* Tabs */}
          <View style={s.tabs}>
            {(['diag','items'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabT, tab === t && s.tabActiveT]}>
                  {t === 'diag' ? '🔍 Гипотезы' : '🔩 Смета'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Диагностика */}
          {tab === 'diag' && (
            <>
              {parsed && (
                <View style={s.parsedRow}>
                  <View style={s.chip}>
                    <Text style={s.chipLabel}>Система</Text>
                    <Text style={s.chipVal}>{parsed.affectedSystem}</Text>
                  </View>
                  <View style={s.chip}>
                    <Text style={s.chipLabel}>Срочность</Text>
                    <Text style={[s.chipVal, { color: URGENCY_COLOR[parsed.urgency] ?? Colors.ash }]}>{parsed.urgency}</Text>
                  </View>
                </View>
              )}

              <View style={s.verd}>
                <Text style={s.verdLabel}>ВЕРДИКТ</Text>
                <Text style={s.verdText}>{diag.totalProbable}</Text>
              </View>

              {diag.hypotheses?.map((h: any) => (
                <View key={h.rank} style={[s.hypo, h.rank === 1 && s.hypoTop]}>
                  <View style={s.hypoHead}>
                    <Text style={s.hypoRank}>#{h.rank}</Text>
                    <Text style={s.hypoTitle} numberOfLines={2}>{h.title}</Text>
                    <Text style={s.hypoPct}>{h.probability}%</Text>
                  </View>
                  <View style={s.hypoBar}>
                    <View style={[s.hypoFill, { width: h.probability + '%' as any, backgroundColor: h.rank === 1 ? Colors.ore : Colors.teal }]} />
                  </View>
                  <Text style={s.hypoDesc}>{h.description}</Text>
                  <Text style={s.hypoTime}>⏱ {h.laborMin}–{h.laborMax} мин</Text>
                </View>
              ))}

              <View style={s.rangeRow}>
                <Text style={s.rangeLabel}>Предв. смета</Text>
                <Text style={s.rangeVal}>{diag.minEstimate?.toLocaleString('ru')} – {diag.maxEstimate?.toLocaleString('ru')} ₽</Text>
              </View>
            </>
          )}

          {/* Смета */}
          {tab === 'items' && (
            <>
              {order.items?.map((item: any, i: number) => (
                <View key={i} style={s.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.type === 'WORK' ? '🔧' : '📦'} {item.name}</Text>
                    {item.article && <Text style={s.itemArt}>{item.article}</Text>}
                  </View>
                  <View style={s.itemRight}>
                    <Text style={s.itemQty}>×{item.qty}</Text>
                    <Text style={s.itemPrice}>{Number(item.retailPrice).toLocaleString('ru')} ₽</Text>
                  </View>
                </View>
              ))}
              {order.totalRetail && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>ИТОГО</Text>
                  <Text style={s.totalVal}>{Number(order.totalRetail).toLocaleString('ru')} ₽</Text>
                </View>
              )}
              {order.status === 'CONFIRMED' && (
                <TouchableOpacity style={s.payBtn} onPress={startPayment} activeOpacity={.8}>
                  <Text style={s.payBtnT}>💳 Оплатить</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={s.rerunBtn} onPress={runPipeline} disabled={running} activeOpacity={.8}>
            <Text style={s.rerunT}>{running ? 'Работают агенты…' : '↺ Перезапустить диагностику'}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void },
  container: { padding: Spacing.lg, paddingBottom: 80 },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.void },
  loadingT:  { color: Colors.dust },
  back:  { marginBottom: Spacing.md },
  backT: { color: Colors.dust, fontSize: 13 },
  eye:   { fontSize: 10, color: Colors.ore, letterSpacing: 3, marginBottom: 4 },
  h1:    { fontSize: 26, fontWeight: '900', color: Colors.chalk, letterSpacing: 2, marginBottom: Spacing.lg },

  pipeline: { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, gap: 10 },
  stepRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCircle: { width: 30, height: 30, borderRadius: 99, borderWidth: 2, borderColor: Colors.wire, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepDone:    { borderColor: Colors.green, backgroundColor: Colors.greenD },
  stepRunning: { borderColor: Colors.ore, backgroundColor: Colors.oreD },
  stepError:   { borderColor: Colors.red, backgroundColor: 'rgba(255,59,59,.1)' },
  stepNum:     { color: Colors.dust, fontSize: 12, fontWeight: '900' },
  stepName:    { color: Colors.chalk, fontSize: 13, fontWeight: '700' },
  stepRunningT:{ color: Colors.ore, fontSize: 10 },
  stepDoneT:   { color: Colors.green, fontSize: 10 },
  stepArrow:   { color: Colors.soot, fontSize: 18 },

  runBtn:  { backgroundColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  runBtnD: { opacity: .5 },
  runBtnT: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  tabs:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.wire, marginBottom: Spacing.md },
  tabBtn:    { paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: Colors.ore },
  tabT:      { fontSize: 13, fontWeight: '600', color: Colors.dust },
  tabActiveT:{ color: Colors.ore },

  parsedRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md, flexWrap: 'wrap' },
  chip:      { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: 10, flex: 1 },
  chipLabel: { fontSize: 9, color: Colors.dust, textTransform: 'uppercase', letterSpacing: 1 },
  chipVal:   { fontSize: 14, fontWeight: '700', color: Colors.chalk, marginTop: 3 },

  verd:      { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderLeftWidth: 3, borderLeftColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  verdLabel: { fontSize: 9, color: Colors.ore, fontWeight: '700', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  verdText:  { fontSize: 13, color: Colors.ash, lineHeight: 20 },

  hypo:    { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  hypoTop: { borderColor: Colors.ore },
  hypoHead:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  hypoRank:{ color: Colors.dust, fontSize: 13, fontWeight: '900', width: 24 },
  hypoTitle:{ flex: 1, color: Colors.chalk, fontSize: 14, fontWeight: '800' },
  hypoPct: { color: Colors.teal, fontSize: 18, fontWeight: '900' },
  hypoBar: { height: 3, backgroundColor: Colors.wire, borderRadius: 2, marginBottom: 8 },
  hypoFill:{ height: 3, borderRadius: 2 },
  hypoDesc:{ color: Colors.dust, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  hypoTime:{ color: Colors.soot, fontSize: 11 },

  rangeRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.plate2, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, marginTop: Spacing.sm },
  rangeLabel:{ fontSize: 11, color: Colors.dust, textTransform: 'uppercase', letterSpacing: 1 },
  rangeVal:  { fontSize: 18, fontWeight: '900', color: Colors.teal },

  itemRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,53,.4)', backgroundColor: Colors.plate, marginBottom: 1 },
  itemName:  { color: Colors.ash, fontSize: 13 },
  itemArt:   { color: Colors.soot, fontSize: 10, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemQty:   { color: Colors.dust, fontSize: 11 },
  itemPrice: { color: Colors.chalk, fontSize: 13, fontWeight: '700' },
  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderTopWidth: 2, borderTopColor: Colors.wire, marginTop: 4 },
  totalLabel:{ color: Colors.dust, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  totalVal:  { color: Colors.teal, fontSize: 22, fontWeight: '900' },

  payBtn:  { backgroundColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  payBtnT: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  rerunBtn: { marginTop: Spacing.lg, backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  rerunT:   { color: Colors.dust, fontSize: 13 },
});
