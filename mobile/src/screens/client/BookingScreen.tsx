import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { api } from '../../services/api';

const SPECS = [
  { type:'MECHANIC',    icon:'🔧', name:'Автослесарь',  sub:'ТО, двигатель, ходовая' },
  { type:'ELECTRICIAN', icon:'⚡', name:'Автоэлектрик', sub:'Электрика, ЭБУ' },
  { type:'DIAGNOSTICS', icon:'🔍', name:'Диагност',     sub:'OBD2, коды ошибок' },
];
const TIMES = ['09:00','10:00','11:00','12:00','14:00','15:00','17:00','18:00'];
const BUSY  = ['10:00','15:00'];

export default function BookingScreen({ navigation }: any) {
  const [spec,      setSpec]  = useState('');
  const [dates,     setDates] = useState<string[]>([]);
  const [selDate,   setDate]  = useState('');
  const [selTime,   setTime]  = useState('');
  const [car,       setCar]   = useState('');
  const [complaint, setComp]  = useState('');
  const [loading,   setLoad]  = useState(false);

  useEffect(() => {
    const d = new Date(); const days: string[] = [];
    while (days.length < 6) {
      d.setDate(d.getDate()+1);
      if (d.getDay()!==0) days.push(d.toLocaleDateString('ru',{weekday:'short',day:'2-digit',month:'short'}));
    }
    setDates(days);
  }, []);

  const submit = async () => {
    if (!spec||!selDate||!selTime||!car||!complaint) { Alert.alert('Ошибка','Заполните все поля'); return; }
    setLoad(true);
    try {
      await new Promise(r=>setTimeout(r,900));
      Alert.alert('Готово!','Запись создана. Ожидайте СМС.', [{ text:'OK', onPress:()=>navigation.navigate('Home') }]);
    } catch { Alert.alert('Ошибка','Попробуйте снова'); }
    finally { setLoad(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.container}>
      <Text style={s.eye}>// ЗАПИСЬ</Text>
      <Text style={s.h1}>К СПЕЦИАЛИСТУ</Text>

      {/* Специалист */}
      <Text style={s.label}>СПЕЦИАЛИСТ</Text>
      <View style={s.specRow}>
        {SPECS.map(sp => (
          <TouchableOpacity key={sp.type} style={[s.specCard, spec===sp.type && s.specSel]}
            onPress={()=>setSpec(sp.type)} activeOpacity={.8}>
            <Text style={s.specIco}>{sp.icon}</Text>
            <Text style={s.specName}>{sp.name}</Text>
            <Text style={s.specSub}>{sp.sub}</Text>
            {spec===sp.type && <Text style={s.specCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Авто */}
      <Text style={s.label}>АВТОМОБИЛЬ</Text>
      <TextInput style={s.input} value={car} onChangeText={setCar}
        placeholder="Toyota Camry 2021" placeholderTextColor={Colors.dust} />

      {/* Жалоба */}
      <Text style={s.label}>ПРОБЛЕМА</Text>
      <TextInput style={[s.input, s.textarea]} value={complaint} onChangeText={setComp}
        placeholder="Опишите симптомы…" placeholderTextColor={Colors.dust} multiline />

      {/* Дата */}
      <Text style={s.label}>ДАТА</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateScroll}>
        {dates.map(d => (
          <TouchableOpacity key={d} style={[s.dateBtn, selDate===d && s.dateSel]} onPress={()=>setDate(d)}>
            <Text style={[s.dateTxt, selDate===d && s.dateTxtSel]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Время */}
      <Text style={s.label}>ВРЕМЯ</Text>
      <View style={s.timeGrid}>
        {TIMES.map(t => (
          <TouchableOpacity key={t} style={[s.timeBtn, BUSY.includes(t)&&s.timeBusy, selTime===t&&s.timeSel]}
            onPress={()=>!BUSY.includes(t)&&setTime(t)} disabled={BUSY.includes(t)}>
            <Text style={[s.timeTxt, selTime===t&&s.timeTxtSel, BUSY.includes(t)&&s.timeTxtBusy]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.btn, loading&&s.btnD]} onPress={submit} disabled={loading} activeOpacity={.8}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnT}>📅 ЗАПИСАТЬСЯ</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.void},
  container:{padding:Spacing.lg,paddingBottom:80},
  eye:{fontSize:10,color:Colors.ore,letterSpacing:3,marginBottom:4},
  h1:{fontWeight:'900',fontSize:32,color:Colors.chalk,letterSpacing:2,marginBottom:Spacing.lg},
  label:{fontSize:10,fontWeight:'700',letterSpacing:2,color:Colors.dust,textTransform:'uppercase',marginBottom:8},
  specRow:{flexDirection:'row',gap:8,marginBottom:Spacing.lg},
  specCard:{flex:1,backgroundColor:Colors.plate,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,padding:10,alignItems:'center',position:'relative'},
  specSel:{borderColor:Colors.green,backgroundColor:Colors.greenD},
  specIco:{fontSize:20,marginBottom:4},
  specName:{fontSize:11,fontWeight:'700',color:Colors.chalk,textAlign:'center'},
  specSub:{fontSize:9,color:Colors.soot,textAlign:'center',marginTop:2},
  specCheck:{position:'absolute',top:4,right:6,fontSize:10,color:Colors.green,fontWeight:'900'},
  input:{backgroundColor:Colors.plate2,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,padding:Spacing.md,color:Colors.chalk,fontSize:14,marginBottom:Spacing.lg},
  textarea:{height:80,textAlignVertical:'top'},
  dateScroll:{marginBottom:Spacing.lg},
  dateBtn:{backgroundColor:Colors.plate2,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,paddingHorizontal:12,paddingVertical:8,marginRight:8},
  dateSel:{borderColor:Colors.green,backgroundColor:Colors.greenD},
  dateTxt:{fontSize:12,color:Colors.dust,fontWeight:'600'},
  dateTxtSel:{color:Colors.green},
  timeGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:Spacing.lg},
  timeBtn:{backgroundColor:Colors.plate2,borderWidth:1,borderColor:Colors.wire,borderRadius:Radius.sm,paddingHorizontal:12,paddingVertical:9,minWidth:72,alignItems:'center'},
  timeSel:{borderColor:Colors.green,backgroundColor:Colors.greenD},
  timeBusy:{opacity:.3},
  timeTxt:{fontSize:12,color:Colors.dust,fontWeight:'700'},
  timeTxtSel:{color:Colors.green},
  timeTxtBusy:{textDecorationLine:'line-through'},
  btn:{backgroundColor:Colors.green,borderRadius:Radius.sm,padding:Spacing.md,alignItems:'center'},
  btnD:{opacity:.5},
  btnT:{color:'#000',fontSize:14,fontWeight:'900',letterSpacing:2},
});
