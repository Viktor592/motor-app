import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';
import { AuthStackParamList } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    dispatch(login({ phone, password }));
  };

  const formatPhone = (text: string) => {
    const nums = text.replace(/\D/g, '');
    if (!nums) return '';
    if (nums.length <= 1) return '+7';
    return '+7' + nums.slice(1, 11);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Лого */}
        <View style={styles.logo}>
          <View style={styles.hex}>
            <Text style={styles.hexText}>М</Text>
          </View>
          <Text style={styles.brand}>МОТОР</Text>
          <Text style={styles.tagline}>AI-экосистема автосервиса</Text>
        </View>

        {/* Форма */}
        <View style={styles.card}>
          <Text style={styles.title}>ВХОД В СИСТЕМУ</Text>
          <Text style={styles.subtitle}>Введите номер телефона и пароль</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>ТЕЛЕФОН</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              placeholder="+79001234567"
              placeholderTextColor={Colors.dust}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ПАРОЛЬ</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••"
              placeholderTextColor={Colors.dust}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>→ ВОЙТИ</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>Нет аккаунта? <Text style={styles.linkAccent}>Зарегистрироваться →</Text></Text>
          </TouchableOpacity>
        </View>

        {/* Версия */}
        <Text style={styles.version}>МОТОР v1.0 · Anthropic Claude AI</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.void },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  logo: { alignItems: 'center', marginBottom: Spacing.xl },
  hex: {
    width: 56, height: 56,
    backgroundColor: Colors.ore,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.ore,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  hexText: { color: '#000', fontSize: 24, fontWeight: '900' },
  brand: { color: Colors.chalk, fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  tagline: { color: Colors.dust, fontSize: 11, letterSpacing: 2, marginTop: 4 },
  card: {
    backgroundColor: Colors.plate,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.wire,
  },
  title: {
    color: Colors.chalk, fontSize: 22,
    fontWeight: '900', letterSpacing: 2, marginBottom: 4,
  },
  subtitle: { color: Colors.dust, fontSize: 12, marginBottom: Spacing.md },
  errorBox: {
    backgroundColor: 'rgba(255,59,59,0.1)',
    borderWidth: 1, borderColor: Colors.red,
    borderRadius: Radius.sm,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.red, fontSize: 13 },
  field: { marginBottom: Spacing.md },
  label: {
    color: Colors.dust, fontSize: 10,
    fontWeight: '700', letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.plate2,
    borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    color: Colors.chalk,
    fontSize: 15,
  },
  btn: {
    backgroundColor: Colors.ore,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  linkRow: { marginTop: Spacing.md, alignItems: 'center' },
  linkText: { color: Colors.dust, fontSize: 13 },
  linkAccent: { color: Colors.ore },
  version: {
    color: Colors.soot, fontSize: 10, letterSpacing: 1,
    textAlign: 'center', marginTop: Spacing.xl,
  },
});
