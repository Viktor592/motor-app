import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './ProfilePage.module.css';

interface Vehicle {
  id: string; brand: string; model: string;
  year: number; mileage?: number; plateNum?: string;
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { name, role } = useSelector((st: RootState) => st.auth);
  const { locale, setLocale, locales, t } = useLocale();

  const [vehicles,   setVehicles]  = useState<Vehicle[]>([]);
  const [avatarUrl,  setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [editName,   setEditName]  = useState(name ?? '');
  const [savingName, setSaving]    = useState(false);
  const [showForm,   setShowForm]  = useState(false);
  const [addingV,    setAddingV]   = useState(false);
  const [vForm, setVForm] = useState({ brand: '', model: '', year: '', mileage: '', plateNum: '' });

  useEffect(() => {
    api.get('/auth/me').then(r => { setVehicles(r.data.vehicles ?? []); setAvatarUrl(r.data.avatarUrl ?? null); setEmail(r.data.email ?? ''); });
  }, []);

  const onAvatarFile = async (file: File) => {
    if (file.size > 400_000) { alert(t('profile.err.photo_too_big')); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setAvatarBusy(true);
      try {
        const { data } = await api.patch('/auth/avatar', { avatarUrl: reader.result as string });
        setAvatarUrl(data.avatarUrl);
      } catch (err: any) {
        alert(err.response?.data?.error ?? t('profile.err.photo_save_failed'));
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
  const [email,      setEmail]      = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg,    setEmailMsg]    = useState('');

  const saveEmail = async () => {
    setEmailSaving(true); setEmailMsg('');
    try {
      await api.patch('/auth/email', { email: email.trim() || null });
      setEmailMsg(`✓ ${t('profile.email_saved')}`);
    } catch (e: any) {
      setEmailMsg(e.response?.data?.error ?? t('profile.err.email_save_failed'));
    } finally { setEmailSaving(false); }
  };

  const changePassword = async () => {
    if (newPwd.length < 6) { setPwdMsg(t('profile.err.pwd_too_short')); return; }
    setPwdSaving(true); setPwdMsg('');
    try {
      await api.patch('/auth/password', { currentPassword: curPwd || undefined, newPassword: newPwd });
      setPwdMsg(`✓ ${t('profile.pwd_changed')}`); setCurPwd(''); setNewPwd('');
    } catch (e: any) {
      setPwdMsg(e.response?.data?.error ?? t('profile.err.pwd_change_failed'));
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
    if (!confirm(t('profile.confirm_delete_vehicle'))) return;
    try {
      await api.delete(`/users/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch {}
  };

  return (
    <div className={s.page}>
      <div className={s.eye}>// {t('profile.eye_label')}</div>
      <h1 className={s.h1}>{t('profile.title')}</h1>

      {/* Hero */}
      <div className={s.hero}>
        <label className={s.ava} style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined, cursor: 'pointer', position: 'relative' }}>
          {!avatarUrl && (name?.[0] ?? '?')}
          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={avatarBusy}
            onChange={e => e.target.files?.[0] && onAvatarFile(e.target.files[0])} />
        </label>
        <div>
          <div className={s.heroName}>{name}</div>
          <div className={s.heroRole}>{t(`profile.role.${(role ?? '').toLowerCase()}`)}</div>
          {avatarUrl
            ? <button onClick={removeAvatar} disabled={avatarBusy} style={{ background: 'none', border: 'none', color: 'var(--dust)', fontSize: 11.5, cursor: 'pointer', padding: 0, marginTop: 4 }}>{t('profile.remove_photo')}</button>
            : <div style={{ fontSize: 11.5, color: 'var(--dust)', marginTop: 4 }}>{t('profile.add_photo_hint')}</div>}
        </div>
      </div>

      {/* Имя */}
      <div className={s.section}>
        <div className={s.sTitle}>{t('profile.name_section')}</div>
        <div className={s.nameRow}>
          <input className={s.input} value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder={t('profile.name_placeholder')}
            onKeyDown={e => e.key === 'Enter' && saveName()}
          />
          <button className={s.saveBtn}
            onClick={saveName}
            disabled={savingName || editName === name || editName.length < 2}
          >
            {savingName ? '…' : t('profile.save_name_btn')}
          </button>
        </div>
      </div>

      {/* Автомобили */}
      {role === 'CLIENT' && (
        <div className={s.section}>
          <div className={s.sHead}>
            <div className={s.sTitle}>{t('profile.my_vehicles')}</div>
            <button className={s.addBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? t('profile.cancel') : t('profile.add')}
            </button>
          </div>

          {/* Форма добавления */}
          {showForm && (
            <form className={s.vForm} onSubmit={addVehicle}>
              <div className={s.vFormGrid}>
                {([
                  { key: 'brand',    label: t('profile.field.brand'),   ph: 'Toyota',    type: 'text'   },
                  { key: 'model',    label: t('profile.field.model'),   ph: 'Camry',     type: 'text'   },
                  { key: 'year',     label: t('profile.field.year'),    ph: '2021',      type: 'number' },
                  { key: 'mileage',  label: t('profile.field.mileage'), ph: '50000',     type: 'number' },
                  { key: 'plateNum', label: t('profile.field.plate'),   ph: 'А123ВС799', type: 'text'   },
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
                {addingV ? t('profile.adding_vehicle') : t('profile.add_vehicle_btn')}
              </button>
            </form>
          )}

          {/* Список */}
          {vehicles.length === 0 && !showForm && (
            <div className={s.empty}>
              <p>{t('profile.no_vehicles')}</p>
              <button className={s.addBtn} onClick={() => setShowForm(true)}>{t('profile.add_arrow')}</button>
            </div>
          )}
          <div className={s.vList}>
            {vehicles.map(v => (
              <div key={v.id} className={s.vCard}>
                <div>
                  <div className={s.vName}>{v.brand} {v.model}</div>
                  <div className={s.vMeta}>
                    <span>{v.year}</span>
                    {v.mileage && <span>{v.mileage.toLocaleString('ru')} {t('profile.km')}</span>}
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
        <div className={s.sTitle}>{t('profile.security')}</div>
        <div className={s.nameRow} style={{ marginBottom: 10 }}>
          <input className={s.input} type="email" placeholder={t('profile.email_placeholder')}
            value={email} onChange={e => setEmail(e.target.value)} />
          <button className={s.saveBtn} onClick={saveEmail} disabled={emailSaving}>
            {emailSaving ? '…' : t('profile.save_email_btn')}
          </button>
        </div>
        {emailMsg && <p style={{ fontSize: 12.5, color: emailMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>{emailMsg}</p>}
        <div className={s.nameRow} style={{ flexWrap: 'wrap' }}>
          <input className={s.input} type="password" placeholder={t('profile.current_pwd_placeholder')}
            value={curPwd} onChange={e => setCurPwd(e.target.value)} style={{ minWidth: 160 }} />
          <input className={s.input} type="password" placeholder={t('profile.new_pwd_placeholder')}
            value={newPwd} onChange={e => setNewPwd(e.target.value)} style={{ minWidth: 160 }} />
          <button className={s.saveBtn} onClick={changePassword} disabled={pwdSaving || newPwd.length < 6}>
            {pwdSaving ? '…' : t('profile.change_pwd_btn')}
          </button>
        </div>
        {pwdMsg && <p style={{ fontSize: 12.5, color: pwdMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginTop: 6 }}>{pwdMsg}</p>}
      </div>

      {/* Язык интерфейса */}
      <div className={s.section}>
        <div className={s.sTitle}>{t('profile.language')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {locales.map(l => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 6, cursor: 'pointer', fontSize: 13,
                border: locale === l.code ? '1px solid var(--ore)' : '1px solid var(--wire)',
                background: locale === l.code ? 'var(--ore-d)' : 'var(--plate2)',
                color: locale === l.code ? 'var(--ore)' : 'var(--chalk)',
              }}
            >
              <span>{l.flag}</span><span>{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Инфо */}
      <div className={s.section}>
        <div className={s.sTitle}>{t('profile.about_system')}</div>
        <div className={s.infoCard}>
          {[
            [t('profile.info.version'), '1.0.0'],
            [t('profile.info.ai_engine'), 'Claude Sonnet 4.6'],
            [t('profile.info.company'), 'МОТОР-СИСТЕМА'],
          ].map(([k, v]) => (
            <div key={k} className={s.infoRow}>
              <span>{k}</span><b>{v}</b>
            </div>
          ))}
        </div>
      </div>

      <button className={s.logoutBtn} onClick={() => dispatch(logout())}>
        {t('profile.logout')}
      </button>
    </div>
  );
}
