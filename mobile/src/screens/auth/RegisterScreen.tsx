import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { Colors, Spacing, Radius } from '../../theme';

export default function RegisterScreen({ navigation }: any) {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [pass,  setPass]  = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const fmt = (v: string) => '+7' + v.replace(/\D/g,'').slice(1,11);

  const submit = async () => {
    if (!name || !phone || !pass) { Alert.alert('Ошибка', 'Заполните все поля'); return; }
    dispatch(register({ phone, name, password: pass }));
  };

  return (
    <KeyboardAvoidingView style={ss.root} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={ss.container} keyboardShouldPersistTaps="handled">
        <View style={ss.logo}>
          <View style={ss.hex}><Text style={ss.hexT}>М</Text></View>
          <Text style={ss.brand}>МОТОР</Text>
        </View>
        <View style={ss.card}>
          <Text style={ss.title}>РЕГИСТРАЦИЯ</Text>
          {error && <View style={ss.errBox}><Text style={ss.errT}>{error}</Text></View>}
          {[
            { label:'ИМЯ',      val:name,  set:setName,  ph:'Алексей',        type:'default' },
            { label:'ТЕЛЕФОН',  val:phone, set:(v:string)=>setPhone(fmt(v)), ph:'+79001234567', type:'phone-pad' },
            { label:'ПАРОЛЬ',   val:pass,  set:setPass,  ph:'Минимум 6 символов', type:'default', secure:true },
          ].map(f => (
            <View key={f.label} style={ss.field}>
              <Text style={ss.label}>{f.label}</Text>
              <TextInput style={ss.input} value={f.val} onChangeText={f.set as any}
                placeholder={f.ph} placeholderTextColor={Colors.dust}
                keyboardType={f.type as any} secureTextEntry={f.secure} />
            </View>
          ))}
          <TouchableOpacity style={[ss.btn, loading && ss.btnD]} onPress={submit} disabled={loading} activeOpacity={.8}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={ss.btnT}>→ ЗАРЕГИСТРИРОВАТЬСЯ</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={ss.linkRow} onPress={() => navigation.navigate('Login')}>
            <Text style={ss.linkT}>Уже есть аккаунт? <Text style={ss.linkA}>Войти →</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.void},
  container:{flexGrow:1,justifyContent:'center',padding:Spacing.lg},
  logo:{alignItems:'center',marginBottom:Spacing.xl},
  hex:{width:48,height:48,backgroundColor:Colors.ore,borderRadius:7,alignItems:'center',justifyContent:'center',marginBottom:Spacing.sm},
  hexT:{color:'#000',fontSize:22,fontWeight:'900'},
  brand:{color:Colors.chalk,fontSize:30,fontWeight:'900',letterSpacing:4},
  card:{backgroundColor:Colors.plate,borderRadius:Radius.md,padding:Spacing.lg,borderWidth:1,borderColor:Colors.wire},
  title:{color:Colors.chalk,fontSize:22,fontWeight:'900',letterSpacing:2,marginBottom:Spacing.md},
  errBox:{backgroundColor:'rgba(255,59,59,.1)',borderWidth:1,borderColor:Colors.red,borderRadius:Radius.sm,padding:Spacing.sm,marginBottom:Spacing.md},
  errT:{color:Colors.red,fontSize:13},
  field:{marginBottom:Spacing.md},
  label:{color:Colors.dust,fontSize:10,fontWeight:'700',letterSpacing:2,marginBottom:Spacing.xs},
  input:{backgroundColor:Colors.plate2,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,padding:Spacing.md,color:Colors.chalk,fontSize:15},
  btn:{backgroundColor:Colors.ore,borderRadius:Radius.sm,padding:Spacing.md,alignItems:'center',marginTop:Spacing.sm},
  btnD:{opacity:.6},
  btnT:{color:'#000',fontSize:13,fontWeight:'900',letterSpacing:2},
  linkRow:{marginTop:Spacing.md,alignItems:'center'},
  linkT:{color:Colors.dust,fontSize:13},
  linkA:{color:Colors.ore},
});
