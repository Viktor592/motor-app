import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { api } from '../../services/api';

type Period = 'week' | 'month' | 'quarter';

interface MasterData {
  summary: {
    totalOrders: number; closedOrders: number; inProgress: number;
    totalRetail: number; margin: number; marginPct: number; avgCheck: number;
  };
  bySpec:  Record<string, number>;
  topWork: { name: string; count: number }[];
  daily:   { date: string; orders: number; revenue: number }[];
}

const PERIOD: Record<Period, string> = { week: 'Неделя', month: 'Месяц', quarter: 'Квартал' };

export default function MasterAnalyticsScreen() {
  const [period,  setPeriod]  = useState<Period>('month');
  const [data,    setData]    = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/analytics/master/me?period=${period}`);
      setData(r.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [period]);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.ore} />}
    >
      {/* Шапка */}
      <Text style={s.eye}>// МОЯ АНАЛИТИКА</Text>
      <Text style={s.h1}>СТАТИСТИКА</Text>

      {/* Период */}
      <View style={s.periods}>
        {(Object.keys(PERIOD) as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[s.pBtn, period === p && s.pActive]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.8}
          >
            <Text style={[s.pBtnT, period === p && s.pActiveT]}>{PERIOD[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !data && (
        <ActivityIndicator color={Colors.ore} style={{ marginTop: 40 }} />
      )}

      {data && (
        <>
          {/* KPI карточки */}
          <View style={s.kpiGrid}>
            {[
              { label: 'Заказов',     val: String(data.summary.totalOrders),                     color: Colors.chalk },
              { label: 'Закрыто',     val: String(data.summary.closedOrders),                    color: Colors.green },
              { label: 'В работе',    val: String(data.summary.inProgress),                      color: Colors.ore   },
              { label: 'Выручка',     val: data.summary.totalRetail.toLocaleString('ru') + ' ₽', color: Colors.teal  },
              { label: 'Ср. чек',     val: data.summary.avgCheck.toLocaleString('ru') + ' ₽',   color: Colors.blue  },
              { label: 'Маржа',       val: data.summary.marginPct + '%',
                color: data.summary.marginPct > 30 ? Colors.green : Colors.gold },
            ].map(({ label, val, color }) => (
              <View key={label} style={s.kpi}>
                <Text style={[s.kpiVal, { color }]}>{val}</Text>
                <Text style={s.kpiLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Топ работ */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🔩 ТОП ВИДОВ РАБОТ</Text>
            {data.topWork.length === 0
              ? <Text style={s.empty}>Нет данных</Text>
              : data.topWork.map((w, i) => {
                const max = data.topWork[0]?.count || 1;
                return (
                  <View key={i} style={s.workRow}>
                    <Text style={s.workName} numberOfLines={1}>{w.name}</Text>
                    <View style={s.workBarWrap}>
                      <View style={[s.workBarFill, { width: `${Math.round(w.count / max * 100)}%` as any }]} />
                    </View>
                    <Text style={s.workCnt}>{w.count}×</Text>
                  </View>
                );
              })
            }
          </View>

          {/* По типу заказов */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🗂 ПО ТИПУ ЗАКАЗОВ</Text>
            {Object.entries(data.bySpec).map(([spec, cnt]) => {
              const labels: Record<string, string> = {
                MECHANIC: '🔧 Слесарные', ELECTRICIAN: '⚡ Электрика', DIAGNOSTICS: '🔍 Диагностика',
              };
              const total = Object.values(data.bySpec).reduce((s, v) => s + v, 0) || 1;
              return (
                <View key={spec} style={s.specRow}>
                  <Text style={s.specLabel}>{labels[spec] ?? spec}</Text>
                  <View style={s.specBarWrap}>
                    <View style={[s.specBarFill, { width: `${Math.round(cnt / total * 100)}%` as any }]} />
                  </View>
                  <Text style={s.specCnt}>{cnt}</Text>
                </View>
              );
            })}
            {Object.keys(data.bySpec).length === 0 && <Text style={s.empty}>Нет данных</Text>}
          </View>

          {/* Активность по дням */}
          {data.daily.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>📅 АКТИВНОСТЬ ПО ДНЯМ</Text>
              <View style={s.dailyChart}>
                {data.daily.map((d, i) => {
                  const max = Math.max(...data.daily.map(x => x.revenue), 1);
                  const h   = Math.max(4, Math.round(d.revenue / max * 60));
                  return (
                    <View key={i} style={s.dayCol}>
                      <Text style={s.dayCnt}>{d.orders}</Text>
                      <View style={[s.dayBar, { height: h }]} />
                      <Text style={s.dayLabel}>{d.date.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void },
  container: { padding: Spacing.lg, paddingBottom: 80 },
  eye:       { fontSize: 10, color: Colors.ore, letterSpacing: 3, marginBottom: 4 },
  h1:        { fontSize: 32, fontWeight: '900', color: Colors.chalk, letterSpacing: 2, marginBottom: Spacing.lg },
  empty:     { color: Colors.soot, fontSize: 13 },

  periods: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  pBtn:    { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 7 },
  pActive: { backgroundColor: Colors.oreD, borderColor: Colors.ore },
  pBtnT:   { fontSize: 12, fontWeight: '700', color: Colors.dust },
  pActiveT:{ color: Colors.ore },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  kpi:     { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.md, flex: 1, minWidth: 100 },
  kpiVal:  { fontSize: 22, fontWeight: '900', marginBottom: 3 },
  kpiLabel:{ fontSize: 10, color: Colors.dust, textTransform: 'uppercase', letterSpacing: 1 },

  section:      { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: Colors.dust, textTransform: 'uppercase', letterSpacing: 2, marginBottom: Spacing.sm },

  workRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  workName:   { flex: 1, fontSize: 12, color: Colors.ash },
  workBarWrap:{ width: 70, height: 4, backgroundColor: Colors.wire, borderRadius: 2, overflow: 'hidden' },
  workBarFill:{ height: '100%' as any, backgroundColor: Colors.ore, borderRadius: 2 },
  workCnt:    { fontSize: 12, fontWeight: '700', color: Colors.chalk, width: 24, textAlign: 'right' },

  specRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  specLabel:  { fontSize: 12, color: Colors.ash, width: 110 },
  specBarWrap:{ flex: 1, height: 5, backgroundColor: Colors.wire, borderRadius: 3, overflow: 'hidden' },
  specBarFill:{ height: '100%' as any, backgroundColor: Colors.teal, borderRadius: 3 },
  specCnt:    { fontSize: 13, fontWeight: '700', color: Colors.chalk, width: 24, textAlign: 'right' },

  dailyChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 90 },
  dayCol:     { flex: 1, alignItems: 'center', gap: 3 },
  dayBar:     { width: '100%' as any, backgroundColor: Colors.ore, borderRadius: 2 },
  dayLabel:   { fontSize: 8, color: Colors.soot },
  dayCnt:     { fontSize: 9, color: Colors.dust, fontWeight: '700' },
});
