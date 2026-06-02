import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp, verifyOtp, clearError } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';

type Step = 'phone' | 'code' | 'name';

export default function OtpScreen() {
  const [step,    setStep]  = useState<Step>('phone');
  const [phone,   setPhone] = useState('');
  const [code,    setCode]  = useState(['', '', '', '']);
  const [timer,   setTimer] = useState(0);
  const codeRefs  = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];
  const dispatch  = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  useEffect(() => {
    if (error) {
      Alert.alert('Ошибка', error, [{ text: 'OK', onPress: () => dispatch(clearError()) }]);
    }
  }, [error]);

  const fmtPhone = (v: string) => {
    const n = v.replace(/\D/g, '');
    if (!n) return '';
    let s = n.startsWith('7') ? n : '7' + n;
    s = s.slice(0, 11);
    let r = '+7';
    if (s.length > 1) r += ' (' + s.slice(1, 4);
    if (s.length >= 4) r += ') ' + s.slice(4, 7);
    if (s.length >= 7) r += '-' + s.slice(7, 9);
    if (s.length >= 9) r += '-' + s.slice(9, 11);
    return r;
  };

  const rawPhone = () => '+7' + phone.replace(/\D/g, '').slice(1);

  const handleSend = async () => {
    const p = rawPhone();
    if (p.length !== 12) { Alert.alert('Ошибка', 'Введите номер полностью'); return; }
    const res = await dispatch(sendOtp(p));
    if (sendOtp.fulfilled.match(res)) {
      setStep('code');
      setTimer(60);
      setCode(['', '', '', '']);
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    }
  };

  const handleCodeChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = d;
    setCode(next);
    if (d && idx < 3) codeRefs[idx + 1].current?.focus();
    if (next.every(c => c !== '')) {
      verifyCode(next.join(''));
    }
  };

  const handleCodeKey = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs[idx - 1].current?.focus();
    }
  };

  const verifyCode = async (fullCode: string) => {
    await dispatch(verifyOtp({ phone: rawPhone(), code: fullCode }));
  };

  const resend = async () => {
    if (timer > 0) return;
    setCode(['', '', '', '']);
    const res = await dispatch(sendOtp(rawPhone()));
    if (sendOtp.fulfilled.match(res)) {
      setTimer(60);
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={ss.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ss.container} keyboardShouldPersistTaps="handled">

        {/* Лого */}
        <View style={ss.logo}>
          <View style={ss.hex}><Text style={ss.hexT}>М</Text></View>
          <Text style={ss.brand}>МОТОР</Text>
          <Text style={ss.tagline}>AI-экосистема автосервиса</Text>
        </View>

        {/* Шаг 1 — телефон */}
        {step === 'phone' && (
          <View style={ss.card}>
            <Text style={ss.title}>ВХОД</Text>
            <Text style={ss.sub}>Введите номер — отправим код подтверждения</Text>
            <View style={ss.field}>
              <Text style={ss.label}>ТЕЛЕФОН</Text>
              <TextInput
                style={ss.input}
                value={phone}
                onChangeText={v => setPhone(fmtPhone(v))}
                placeholder="+7 (999) 000-00-00"
                placeholderTextColor={Colors.dust}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[ss.btn, loading && ss.btnD]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={ss.btnT}>Получить код →</Text>
              }
            </TouchableOpacity>
            <Text style={ss.hint}>Новый аккаунт создаётся автоматически</Text>
          </View>
        )}

        {/* Шаг 2 — код */}
        {step === 'code' && (
          <View style={ss.card}>
            <Text style={ss.title}>КОД</Text>
            <Text style={ss.sub}>Отправили SMS на {phone}</Text>

            <View style={ss.codeRow}>
              {code.map((c, i) => (
                <TextInput
                  key={i}
                  ref={codeRefs[i]}
                  style={[ss.codeBox, c && ss.codeBoxFilled]}
                  value={c}
                  onChangeText={v => handleCodeChange(v, i)}
                  onKeyPress={e => handleCodeKey(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {loading && (
              <View style={ss.verifyRow}>
                <ActivityIndicator color={Colors.ore} size="small" />
                <Text style={ss.verifyT}>Проверяем код…</Text>
              </View>
            )}

            <TouchableOpacity onPress={resend} disabled={timer > 0} style={ss.resendRow}>
              <Text style={[ss.resendT, timer > 0 && ss.resendDisabled]}>
                {timer > 0 ? `Повторная отправка через ${timer} с` : 'Отправить код снова'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('phone')} style={ss.backRow}>
              <Text style={ss.backT}>← Изменить номер</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logo:      { alignItems: 'center', marginBottom: Spacing.xl },
  hex: {
    width: 56, height: 56, backgroundColor: Colors.ore, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    shadowColor: Colors.ore, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  hexT:    { color: '#000', fontSize: 26, fontWeight: '900' },
  brand:   { color: Colors.chalk, fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  tagline: { color: Colors.dust, fontSize: 11, letterSpacing: 2, marginTop: 4 },

  card:    { backgroundColor: Colors.plate, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.wire },
  title:   { color: Colors.chalk, fontSize: 28, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
  sub:     { color: Colors.dust, fontSize: 13, lineHeight: 18, marginBottom: Spacing.lg },
  field:   { marginBottom: Spacing.md },
  label:   { color: Colors.dust, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.plate2, borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.sm, padding: Spacing.md, color: Colors.chalk, fontSize: 18, letterSpacing: 2,
  },
  btn:  { backgroundColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', marginTop: 4 },
  btnD: { opacity: 0.6 },
  btnT: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  hint: { color: Colors.soot, fontSize: 11, textAlign: 'center', marginTop: Spacing.sm },

  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: Spacing.lg },
  codeBox: {
    width: 56, height: 64, backgroundColor: Colors.plate2,
    borderWidth: 2, borderColor: Colors.wire, borderRadius: Radius.sm,
    textAlign: 'center', fontSize: 28, fontWeight: '900', color: Colors.chalk,
  },
  codeBoxFilled: { borderColor: Colors.ore, backgroundColor: Colors.oreD },
  verifyRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: Spacing.md },
  verifyT:      { color: Colors.ore, fontSize: 13 },
  resendRow:    { alignItems: 'center', paddingVertical: Spacing.sm },
  resendT:      { color: Colors.ore, fontSize: 13, fontWeight: '600' },
  resendDisabled: { color: Colors.soot },
  backRow:      { alignItems: 'center', marginTop: Spacing.xs },
  backT:        { color: Colors.dust, fontSize: 12 },
});
