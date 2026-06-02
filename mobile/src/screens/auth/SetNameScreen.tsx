import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateName } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';

export default function SetNameScreen() {
  const [name, setName] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((s: RootState) => s.auth);

  const submit = () => {
    if (name.trim().length < 2) return;
    dispatch(updateName(name.trim()));
  };

  return (
    <KeyboardAvoidingView style={ss.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={ss.container}>
        <View style={ss.hex}><Text style={ss.hexT}>М</Text></View>
        <Text style={ss.title}>КАК ВАС ЗОВУТ?</Text>
        <Text style={ss.sub}>Укажите имя — так мастер будет знать, как к вам обращаться</Text>
        <TextInput
          style={ss.input}
          value={name}
          onChangeText={setName}
          placeholder="Например: Алексей"
          placeholderTextColor={Colors.dust}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <TouchableOpacity
          style={[ss.btn, (loading || name.length < 2) && ss.btnD]}
          onPress={submit}
          disabled={loading || name.length < 2}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={ss.btnT}>Сохранить →</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.void, justifyContent: 'center' },
  container: { padding: Spacing.xl, alignItems: 'center' },
  hex: {
    width: 56, height: 56, backgroundColor: Colors.ore, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  hexT:  { color: '#000', fontSize: 26, fontWeight: '900' },
  title: { color: Colors.chalk, fontSize: 28, fontWeight: '900', letterSpacing: 3, marginBottom: 8, textAlign: 'center' },
  sub:   { color: Colors.dust, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: Spacing.xl },
  input: {
    width: '100%', backgroundColor: Colors.plate, borderWidth: 1, borderColor: Colors.wire,
    borderRadius: Radius.sm, padding: Spacing.md, color: Colors.chalk,
    fontSize: 18, textAlign: 'center', marginBottom: Spacing.md,
  },
  btn:  { width: '100%', backgroundColor: Colors.ore, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  btnD: { opacity: 0.5 },
  btnT: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});
