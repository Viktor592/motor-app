// ═══════════════════════════════════════════════════
// МОТОР — Select Specialist Screen (Booking Step 1)
// ═══════════════════════════════════════════════════
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookingStackParamList, SpecialistType } from '@motor/shared';
import { SPECIALIST_META } from '@motor/shared';
import { useBookingFlowStore } from '@motor/shared';
import { Colors, Spacing, Radius, commonStyles } from '../../theme';

type Props = NativeStackScreenProps<BookingStackParamList, 'SelectSpecialist'>;

const SPECIALISTS: SpecialistType[] = ['mechanic', 'electrician', 'diagnostics'];

export function SelectSpecialistScreen({ navigation }: Props) {
  const setSpecialist = useBookingFlowStore((s) => s.setSpecialist);

  // Staggered card entrance
  const anims = SPECIALISTS.map(() => useRef(new Animated.Value(0)).current);
  useEffect(() => {
    Animated.stagger(120,
      anims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
      )
    ).start();
  }, []);

  const handleSelect = (type: SpecialistType) => {
    setSpecialist(type);
    navigation.navigate('CarInfo', { specialistType: type });
  };

  return (
    <View style={commonStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.void} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>// Шаг 1 из 5</Text>
          <Text style={styles.title}>ВЫБЕРИТЕ{'\n'}СПЕЦИАЛИСТА</Text>
        </View>
        <View style={styles.stepDots}>
          {[1,2,3,4,5].map((n) => (
            <View key={n} style={[styles.dot, n === 1 && styles.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Specialist cards */}
        {SPECIALISTS.map((type, i) => {
          const meta = SPECIALIST_META[type];
          return (
            <Animated.View
              key={type}
              style={{
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({
                  inputRange: [0, 1], outputRange: [30, 0],
                })}],
              }}
            >
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => handleSelect(type)}
              >
                {/* Accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

                <View style={styles.cardInner}>
                  <View style={[styles.iconWrap, { borderColor: meta.color, shadowColor: meta.color }]}>
                    <Text style={styles.icon}>{meta.icon}</Text>
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.specName}>{meta.label.toUpperCase()}</Text>
                    <Text style={styles.specDesc}>{meta.description}</Text>
                    <View style={styles.tagRow}>
                      {meta.competencies.slice(0, 2).map((c) => (
                        <View key={c} style={[styles.tag, { borderColor: meta.color + '55', backgroundColor: meta.color + '18' }]}>
                          <Text style={[styles.tagText, { color: meta.color }]}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.arrow, { color: meta.color }]}>›</Text>
                </View>

                <View style={styles.cardFoot}>
                  <Text style={styles.footLabel}>
                    {meta.competencies.length} видов работ
                  </Text>
                  <Text style={[styles.footAction, { color: meta.color }]}>
                    Выбрать →
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Info block */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>🤖 Как работает запись</Text>
          {[
            ['🤝', 'Приёмщик', 'Парсит ваше описание проблемы'],
            ['🔍', 'Диагност', 'Формирует список гипотез неисправностей'],
            ['💰', 'Оценщик', 'Готовит предварительную смету'],
            ['📦', 'Снабженец', 'Резервирует запчасти у поставщиков'],
            ['📅', 'Планировщик', 'Бронирует пост с учётом ETA деталей'],
          ].map(([ico, name, desc]) => (
            <View key={name} style={styles.infoRow}>
              <Text style={styles.infoIco}>{ico}</Text>
              <View style={styles.infoTexts}>
                <Text style={styles.infoName}>{name}</Text>
                <Text style={styles.infoDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.wire,
    backgroundColor: Colors.void2,
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.ore,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    color: Colors.chalk,
    lineHeight: 34,
  },
  stepDots: { flexDirection: 'row', gap: 5, marginBottom: Spacing.sm },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.wire2,
  },
  dotActive: { backgroundColor: Colors.ore, width: 18 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  card: {
    backgroundColor: Colors.plate,
    borderWidth: 1,
    borderColor: Colors.wire,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  cardAccent: { height: 2, width: '100%' },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 52, height: 52,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: Colors.plate2,
  },
  icon: { fontSize: 26 },
  cardText: { flex: 1, gap: Spacing.xs },
  specName: {
    fontSize: 18, fontWeight: '800',
    letterSpacing: 1.5, color: Colors.chalk,
  },
  specDesc: { fontSize: 12, color: Colors.dust, lineHeight: 17 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  tag: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: Radius.sm, borderWidth: 1,
  },
  tagText: { fontSize: 9, letterSpacing: 0.5, fontWeight: '700' },
  arrow: { fontSize: 28, fontWeight: '300' },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.wire,
    backgroundColor: Colors.plate2,
  },
  footLabel: { fontSize: 11, color: Colors.dust },
  footAction: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  infoBlock: {
    backgroundColor: Colors.plate,
    borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.chalk, marginBottom: Spacing.xs },
  infoRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  infoIco: { fontSize: 16, marginTop: 1 },
  infoTexts: { flex: 1 },
  infoName: { fontSize: 12, fontWeight: '700', color: Colors.ash },
  infoDesc: { fontSize: 11, color: Colors.dust, marginTop: 1 },
});
