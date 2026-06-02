// ═══════════════════════════════════════════════════
// МОТОР — Booking Stack Navigator
// ═══════════════════════════════════════════════════
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BookingStackParamList } from '@motor/shared';
import { Colors, Spacing } from '../../theme';

// Steps
import { SelectSpecialistScreen } from './SelectSpecialistScreen';
import { CarInfoScreen }          from './CarInfoScreen';
import { ComplaintScreen }        from './ComplaintScreen';
import { SelectSlotScreen }       from './SelectSlotScreen';
import { ConfirmScreen }          from './ConfirmScreen';
import { SuccessScreen }          from './SuccessScreen';

const Stack = createNativeStackNavigator<BookingStackParamList>();

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn}>
      <Text style={styles.backText}>‹ Назад</Text>
    </TouchableOpacity>
  );
}

export function BookingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: Colors.chalk,
        headerLeft: () =>
          navigation.canGoBack() ? (
            <BackButton onPress={() => navigation.goBack()} />
          ) : null,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.void },
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen
        name="SelectSpecialist"
        component={SelectSpecialistScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CarInfo"
        component={CarInfoScreen}
        options={{ title: 'Ваш автомобиль' }}
      />
      <Stack.Screen
        name="Complaint"
        component={ComplaintScreen}
        options={{ title: 'Опишите проблему' }}
      />
      <Stack.Screen
        name="SelectSlot"
        component={SelectSlotScreen}
        options={{ title: 'Выбор времени' }}
      />
      <Stack.Screen
        name="Confirm"
        component={ConfirmScreen}
        options={{ title: 'Подтверждение' }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.void2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.wire,
  } as any,
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.chalk,
  },
  backBtn: { paddingRight: Spacing.md },
  backText: { fontSize: 15, color: Colors.ore, fontWeight: '600' },
});
