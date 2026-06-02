// ═══════════════════════════════════════════════════
// МОТОР — Home Screen
// ═══════════════════════════════════════════════════
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@motor/shared';
import { usePostsStore, useMyBookingsStore, BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '@motor/shared';
import { Colors, Spacing, Radius, commonStyles } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { posts, fetch: fetchPosts } = usePostsStore();
  const { bookings, fetch: fetchBookings } = useMyBookingsStore();

  useEffect(() => {
    fetchPosts();
    fetchBookings();
  }, []);

  const latestBooking = bookings[0];

  return (
    <View style={commonStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.void} />

      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <View style={styles.hex}>
            <Text style={styles.hexLetter}>М</Text>
          </View>
          <View>
            <Text style={styles.brand}>МОТОР</Text>
            <Text style={styles.brandSub}>AI-ЭКОСИСТЕМА</Text>
          </View>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Активна</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>// БЫСТРЫЕ ДЕЙСТВИЯ</Text>
        <View style={styles.qaGrid}>
          <TouchableOpacity
            style={[styles.qaCard, styles.qaCardPrimary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={styles.qaIco}>📅</Text>
            <Text style={styles.qaLabel}>ЗАПИСАТЬСЯ</Text>
            <Text style={styles.qaSub}>К специалисту</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qaCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MyOrders')}
          >
            <Text style={styles.qaIco}>📋</Text>
            <Text style={styles.qaLabel}>МОИ ЗАКАЗЫ</Text>
            <Text style={styles.qaSub}>{bookings.length} заявок</Text>
          </TouchableOpacity>
        </View>

        {/* Active booking */}
        {latestBooking && ['new','confirmed','in_progress'].includes(latestBooking.status) && (
          <>
            <Text style={styles.sectionLabel}>// АКТИВНАЯ ЗАПИСЬ</Text>
            <TouchableOpacity
              style={styles.activeCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyOrders')}
            >
              <View style={styles.activeTop}>
                <Text style={styles.activeOrderNum}>{latestBooking.orderNumber}</Text>
                <View style={[
                  styles.statusChip,
                  { backgroundColor: BOOKING_STATUS_COLOR[latestBooking.status] + '22',
                    borderColor: BOOKING_STATUS_COLOR[latestBooking.status] + '55' }
                ]}>
                  <Text style={[styles.statusChipText, { color: BOOKING_STATUS_COLOR[latestBooking.status] }]}>
                    {BOOKING_STATUS_LABEL[latestBooking.status].toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.activeCar}>
                {latestBooking.car.make} {latestBooking.car.model}
              </Text>
              <Text style={styles.activeSlot}>
                {latestBooking.slotDate} · {latestBooking.slotTime} · Пост #{latestBooking.postNumber}
              </Text>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View style={[
                  styles.progressFill,
                  { width: `${{
                    new: 10, estimated: 30, confirmed: 45,
                    in_progress: 70, ready: 95, closed: 100, cancelled: 0,
                  }[latestBooking.status] ?? 0}%` as any }
                ]} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Workshop posts */}
        <Text style={styles.sectionLabel}>// ПОСТЫ СЕРВИСА</Text>
        {posts.length === 0 ? (
          // Placeholder posts while loading
          [{id:1,name:'Пост #1',type:'mechanic',slotsTotal:6,slotsFree:3},
           {id:2,name:'Пост #2',type:'mechanic',slotsTotal:6,slotsFree:1},
           {id:3,name:'Пост #3',type:'electrician',slotsTotal:6,slotsFree:4},
           {id:4,name:'Пост #4',type:'diagnostics',slotsTotal:3,slotsFree:2}].map((p) => (
            <PostRow key={p.id} post={p as any} />
          ))
        ) : posts.map((p) => <PostRow key={p.id} post={p} />)}

        {/* AI agents status */}
        <Text style={styles.sectionLabel}>// AI-АГЕНТЫ</Text>
        <View style={styles.agentsGrid}>
          {[
            {ico:'🤝', name:'Приёмщик', status:'Активен', color: Colors.green},
            {ico:'💰', name:'Оценщик',  status:'Активен', color: Colors.green},
            {ico:'🔍', name:'Диагност', status:'Активен', color: Colors.green},
            {ico:'📦', name:'Снабженец',status:'Активен', color: Colors.green},
            {ico:'📅', name:'Планировщик',status:'Активен',color:Colors.green},
            {ico:'🧾', name:'Бухгалтер',status:'Новый',   color: Colors.teal},
          ].map((a) => (
            <View key={a.name} style={styles.agentCard}>
              <Text style={styles.agentIco}>{a.ico}</Text>
              <Text style={styles.agentName}>{a.name}</Text>
              <Text style={[styles.agentStatus, { color: a.color }]}>{a.status}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function PostRow({ post }: { post: { id: number; name: string; slotsFree: number; slotsTotal: number } }) {
  const pct = post.slotsFree / post.slotsTotal;
  const color = pct < 0.25 ? Colors.red : pct < 0.5 ? Colors.ore : Colors.green;
  return (
    <View style={styles.postRow}>
      <Text style={styles.postName}>{post.name}</Text>
      <View style={styles.postTrack}>
        <View style={[styles.postFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.postSlots, { color }]}>{post.slotsFree}/{post.slotsTotal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.void2,
    borderBottomWidth: 2, borderBottomColor: Colors.ore,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    shadowColor: Colors.ore, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hex: {
    width: 36, height: 36, backgroundColor: Colors.ore,
    borderRadius: 4, alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '30deg' }],
  },
  hexLetter: { fontSize: 16, fontWeight: '900', color: '#000', transform: [{ rotate: '-30deg' }] },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: 3, color: Colors.chalk },
  brandSub: { fontSize: 8, letterSpacing: 2, color: Colors.soot },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.green + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.green + '55' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  liveText: { fontSize: 10, fontWeight: '700', color: Colors.green, letterSpacing: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 80 },
  sectionLabel: { fontSize: 10, letterSpacing: 2.5, color: Colors.soot, textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.xs },
  qaGrid: { flexDirection: 'row', gap: Spacing.sm },
  qaCard: { flex: 1, backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.lg, gap: Spacing.xs },
  qaCardPrimary: { borderLeftWidth: 3, borderLeftColor: Colors.ore },
  qaIco: { fontSize: 24 },
  qaLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: Colors.chalk },
  qaSub: { fontSize: 11, color: Colors.dust },
  activeCard: { backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderLeftWidth: 3, borderLeftColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.lg, gap: Spacing.xs },
  activeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  activeOrderNum: { fontSize: 20, fontWeight: '900', letterSpacing: 1, color: Colors.chalk },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, borderWidth: 1 },
  statusChipText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  activeCar: { fontSize: 14, color: Colors.ash },
  activeSlot: { fontSize: 12, color: Colors.dust },
  progressTrack: { height: 3, backgroundColor: Colors.cage, borderRadius: 2, marginTop: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.ore, borderRadius: 2 },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  postName: { fontSize: 12, color: Colors.ash, width: 80 },
  postTrack: { flex: 1, height: 4, backgroundColor: Colors.cage, borderRadius: 2, overflow: 'hidden' },
  postFill: { height: '100%', borderRadius: 2 },
  postSlots: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
  agentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  agentCard: { width: '30%', backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center', gap: 3 },
  agentIco: { fontSize: 20 },
  agentName: { fontSize: 10, fontWeight: '700', color: Colors.ash, textAlign: 'center' },
  agentStatus: { fontSize: 9, letterSpacing: 0.5 },
});
