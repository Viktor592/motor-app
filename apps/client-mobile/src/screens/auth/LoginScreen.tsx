import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api, saveAuth } from '../../services/api';

interface Props { onLogin: () => void; }

export default function LoginScreen({ onLogin }: Props) {
  const [phone, setPhone]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    const n = d.startsWith('7') ? d : d.startsWith('8') ? '7' + d.slice(1) : '7' + d;
    return '+' + n.slice(0, 11);
  };

  const login = async () => {
    if (!phone || !password) { Alert.alert('Ошибка', 'Введите телефон и пароль'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      if (data.user.role !== 'CLIENT') {
        Alert.alert('Ошибка', 'Это приложение для клиентов');
        return;
      }
      await saveAuth(data);
      onLogin();
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.error ?? 'Ошибка входа');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.logo}>⬡ МОТОР</Text>
      <Text style={s.title}>Вход для клиентов</Text>
      <TextInput style={s.input} placeholder="+79001234567" placeholderTextColor="#555"
        keyboardType="phone-pad" value={phone} onChangeText={v => setPhone(fmtPhone(v))} />
      <TextInput style={s.input} placeholder="Пароль" placeholderTextColor="#555"
        secureTextEntry value={password} onChangeText={setPass} />
      <TouchableOpacity style={s.btn} onPress={login} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Входим…' : 'Войти →'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { flex:1, backgroundColor:'#060608', justifyContent:'center', padding:24 },
  logo:    { color:'#ff6200', fontSize:32, fontWeight:'bold', textAlign:'center', marginBottom:8 },
  title:   { color:'#c8c8d8', fontSize:16, textAlign:'center', marginBottom:32 },
  input:   { backgroundColor:'#16161b', color:'#f0f0f5', borderRadius:8, padding:14,
             marginBottom:12, fontSize:16, borderWidth:1, borderColor:'#2a2a35' },
  btn:     { backgroundColor:'#ff6200', borderRadius:8, padding:16, alignItems:'center', marginTop:8 },
  btnText: { color:'#fff', fontWeight:'bold', fontSize:16 },
});
