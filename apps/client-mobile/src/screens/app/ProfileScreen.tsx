import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, clearAuth } from '../../services/api';

interface Props { onLogout: () => void; }

export default function ProfileScreen({ onLogout }: Props) {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('motor_user_name').then(n => setName(n ?? ''));
    SecureStore.getItemAsync('motor_user_phone').then(p => setPhone(p ?? ''));
  }, []);

  const save = async () => {
    await api.patch('/profile', { name });
    await SecureStore.setItemAsync('motor_user_name', name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    await clearAuth();
    onLogout();
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Профиль</Text>

      <View style={s.avatar}>
        <Text style={s.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
      </View>

      <Text style={s.label}>Имя</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor="#555" />

      <Text style={s.label}>Телефон</Text>
      <TextInput style={[s.input, s.disabled]} value={phone} editable={false} />

      <TouchableOpacity style={s.btn} onPress={save}>
        <Text style={s.btnText}>{saved ? '✓ Сохранено' : 'Сохранить'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.btn, s.btnOut]} onPress={logout}>
        <Text style={s.btnOutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { flex:1, backgroundColor:'#060608', padding:24 },
  title:      { color:'#f0f0f5', fontSize:22, fontWeight:'bold', marginTop:8, marginBottom:24 },
  avatar:     { width:72, height:72, borderRadius:36, backgroundColor:'#ff6200',
                justifyContent:'center', alignItems:'center', marginBottom:24, alignSelf:'center' },
  avatarText: { color:'#fff', fontSize:28, fontWeight:'bold' },
  label:      { color:'#6a6a80', fontSize:12, marginBottom:6, textTransform:'uppercase', letterSpacing:1 },
  input:      { backgroundColor:'#16161b', color:'#f0f0f5', borderRadius:8, padding:14,
                marginBottom:16, fontSize:15, borderWidth:1, borderColor:'#2a2a35' },
  disabled:   { opacity:0.5 },
  btn:        { backgroundColor:'#ff6200', borderRadius:10, padding:16, alignItems:'center', marginBottom:12 },
  btnText:    { color:'#fff', fontWeight:'bold', fontSize:15 },
  btnOut:     { backgroundColor:'transparent', borderWidth:1, borderColor:'#2a2a35' },
  btnOutText: { color:'#ff3b3b', fontWeight:'bold', fontSize:15 },
});
