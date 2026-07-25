import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { api } from '../services/api';
import s from './ProfilePage.module.css';

interface Vehicle {
  id: string; brand: string; model: string;
  year: number; mileage?: number; plateNum?: string;
}

const ROLE_LABEL: Record<string, string> = {
  CLIENT: 'Клиент', MASTER: 'Мастер', RECEPTIONIST: 'Приёмщик', ADMIN: 'Администратор',
};

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { name, role } = useSelector((st: RootState) => st.auth);

  const [vehicles,   setVehicles]  = useState<Vehicle[]>([]);
  const [avatarUrl,  setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [editName,   setEditName]  = useState(name ?? '');
  const [savingName, setSaving]    = useState(false);
  const [showForm,   setShowForm]  = useState(false);
  const [addingV,    setAddingV]   = useState(false);
  const [vForm, setVForm] = useState({ brand: '', model: '', year: '', mileage: '', plateNum: '' });

  useEffect(() => {
    api.get('/auth/me').then(r => { setVehicles(r.data.vehicles ?? []); setAvatarUrl(r.data.avatarUrl ?? null); });
  }, []);

  const onAvatarFile = async (file: File) => {
    if (file.size > 400_000) { alert('Фото слишком большое — выберите файл до 400КБ'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setAvatarBusy(true);
      try {
        const { data } = await api.patch('/auth/avatar', { avatarUrl: reader.result as string });
        setAvatarUrl(data.avatarUrl);
      } catch (err: any) {
        alert(err.response?.data?.error ?? 'Не удалось сохранить фото. Попробуйте файл поменьше.');
      } finally { setAvatarBusy(false); }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try { await api.patch('/auth/avatar', { avatarUrl: null }); setAvatarUrl(null); }
    finally { setAvatarBusy(false); }
  };

  const [curPwd,  setCurPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,    setPwdMsg]    = useState('');

  const changePassword = async () => {
    if (newPwd.length < 6) { setPwdMsg('Новый пароль должен быть от 6 символов'); return; }
    setPwdSaving(true); setPwdMsg('');
    try {
      await api.patch('/auth/password', { currentPassword: curPwd || undefined, newPassword: newPwd });
      setPwdMsg('✓ Пароль изменён'); setCurPwd(''); setNewPwd('');
    } catch (e: any) {
      setPwdMsg(e.response?.data?.error ?? 'Не удалось сменить пароль');
    } finally { setPwdSaving(false); }
  };

  const saveName = async () => {
    if (editName.trim().length < 2 || editName === name) return;
    setSaving(true);
    try {
      await api.patch('/auth/name', { name: editName.trim() });
      localStorage.setItem('user_name', editName.trim());
    } catch {}
    finally { setSaving(false); }
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vForm.brand || !vForm.model || !vForm.year) return;
    setAddingV(true);
    try {
      await api.post('/users/vehicles', {
        brand: vForm.brand, model: vForm.model,
        year:    parseInt(vForm.year),
        mileage: vForm.mileage ? parseInt(vForm.mileage) : undefined,
        plateNum: vForm.plateNum || undefined,
      });
      const { data: r } = await api.get('/auth/me');
      setVehicles(r.vehicles ?? []);
      setVForm({ brand: '', model: '', year: '', mileage: '', plateNum: '' });
      setShowForm(false);
    } catch {}
    finally { setAddingV(false); }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Удалить автомобиль?')) return;
    try {
      await api.delete(`/users/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch {}
  };

  return (
    <div className={s.page}>
      <div className={s.eye}>// Профиль</div>
      <h1 className={s.h1}>ПРОФИЛЬ</h1>

      {/* Hero */}
      <div className={s.hero}>
        <label className={s.ava} style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined, cursor: 'pointer', position: 'relative' }}>
          {!avatarUrl && (name?.[0] ?? '?')}
          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={avatarBusy}
            onChange={e => e.target.files?.[0] && onAvatarFile(e.target.files[0])} />
        </label>
        <div>
          <div className={s.heroName}>{name}</div>
          <div className={s.heroRole}>{ROLE_LABEL[role ?? ''] ?? role}</div>
          {avatarUrl
            ? <button onClick={removeAvatar} disabled={avatarBusy} style={{ background: 'none', border: 'none', color: 'var(--dust)', fontSize: 11.5, cursor: 'pointer', padding: 0, marginTop: 4 }}>Удалить фото</button>
            : <div style={{ fontSize: 11.5, color: 'var(--dust)', marginTop: 4 }}>Нажмите на кружок, чтобы добавить фото</div>}
        </div>
      </div>

      {/* Имя */}
      <div className={s.section}>
        <div className={s.sTitle}>ИМЯ</div>
        <div className={s.nameRow}>
          <input className={s.input} value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="Ваше имя"
            onKeyDown={e => e.key === 'Enter' && saveName()}
          />
          <button className={s.saveBtn}
            onClick={saveName}
            disabled={savingName || editName === name || editName.length < 2}
          >
            {savingName ? '…' : '✓ Сохранить'}
          </button>
        </div>
      </div>

      {/* Автомобили */}
      {role === 'CLIENT' && (
        <div className={s.section}>
          <div className={s.sHead}>
            <div className={s.sTitle}>МОИ АВТОМОБИЛИ</div>
            <button className={s.addBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Отмена' : '+ Добавить'}
            </button>
          </div>

          {/* Форма добавления */}
          {showForm && (
            <form className={s.vForm} onSubmit={addVehicle}>
              <div className={s.vFormGrid}>
                {([
                  { key: 'brand',    label: 'МАРКА',   ph: 'Toyota',    type: 'text'   },
                  { key: 'model',    label: 'МОДЕЛЬ',  ph: 'Camry',     type: 'text'   },
                  { key: 'year',     label: 'ГОД',     ph: '2021',      type: 'number' },
                  { key: 'mileage',  label: 'ПРОБЕГ',  ph: '50000',     type: 'number' },
                  { key: 'plateNum', label: 'ГОЗНАК',  ph: 'А123ВС799', type: 'text'   },
                ] as const).map(f => (
                  <div key={f.key} className={s.vField}>
                    <label className={s.vLabel}>{f.label}</label>
                    <input
                      className={s.input}
                      type={f.type}
                      placeholder={f.ph}
                      value={(vForm as any)[f.key]}
                      onChange={e => setVForm(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <button className={s.confirmBtn} type="submit" disabled={addingV}>
                {addingV ? 'Добавляем…' : '+ Добавить автомобиль'}
              </button>
            </form>
          )}

          {/* Список */}
          {vehicles.length === 0 && !showForm && (
            <div className={s.empty}>
              <p>Нет автомобилей</p>
              <button className={s.addBtn} onClick={() => setShowForm(true)}>Добавить →</button>
            </div>
          )}
          <div className={s.vList}>
            {vehicles.map(v => (
              <div key={v.id} className={s.vCard}>
                <div>
                  <div className={s.vName}>{v.brand} {v.model}</div>
                  <div className={s.vMeta}>
                    <span>{v.year}</span>
                    {v.mileage && <span>{v.mileage.toLocaleString('ru')} км</span>}
                    {v.plateNum && <span>{v.plateNum}</span>}
                  </div>
                </div>
                <button className={s.delBtn} onClick={() => deleteVehicle(v.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Безопасность */}
      <div className={s.section}>
        <div className={s.sTitle}>БЕЗОПАСНОСТЬ</div>
        <div className={s.nameRow} style={{ flexWrap: 'wrap' }}>
          <input className={s.input} type="password" placeholder="Текущий пароль (если есть)"
            value={curPwd} onChange={e => setCurPwd(e.target.value)} style={{ minWidth: 160 }} />
          <input className={s.input} type="password" placeholder="Новый пароль"
            value={newPwd} onChange={e => setNewPwd(e.target.value)} style={{ minWidth: 160 }} />
          <button className={s.saveBtn} onClick={changePassword} disabled={pwdSaving || newPwd.length < 6}>
            {pwdSaving ? '…' : '✓ Сменить пароль'}
          </button>
        </div>
        {pwdMsg && <p style={{ fontSize: 12.5, color: pwdMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginTop: 6 }}>{pwdMsg}</p>}
      </div>

      {/* Инфо */}
      <div className={s.section}>
        <div className={s.sTitle}>О СИСТЕМЕ</div>
        <div className={s.infoCard}>
          {[
            ['Версия', '1.0.0'],
            ['AI-движок', 'Claude Sonnet 4.6'],
            ['Компания', 'МОТОР-СИСТЕМА'],
          ].map(([k, v]) => (
            <div key={k} className={s.infoRow}>
              <span>{k}</span><b>{v}</b>
            </div>
          ))}
        </div>
      </div>

      <button className={s.logoutBtn} onClick={() => dispatch(logout())}>
        Выйти из аккаунта
      </button>
    </div>
  );
}
