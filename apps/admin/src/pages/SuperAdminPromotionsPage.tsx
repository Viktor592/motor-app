import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../services/api';
import s from './AdminPage.module.css';

export default function SuperAdminPromotionsPage() {
  const [promos, setPromos]     = useState<any[]>([]);
  const [audience, setAudience] = useState<'CLIENTS' | 'OWNERS'>('CLIENTS');
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [image, setImage]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => api.get('/saas/admin/promotions').then(r => setPromos(r.data.promotions)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const onFile = (f: File) => {
    if (f.size > 500_000) { setError('Картинка больше 500КБ — выберите файл поменьше'); return; }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 2 || body.length < 2) return;
    setSaving(true); setError('');
    try {
      await api.post('/saas/admin/promotions', { title, body, audience, imageUrl: image ?? undefined });
      setTitle(''); setBody(''); setImage(null); await load();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Не удалось опубликовать');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await api.delete(`/saas/admin/promotions/${id}`);
    await load();
  };

  return (
    <div className={s.page}>
      <div className={s.eye}>SUPERADMIN</div>
      <h1 className={s.h1}>Реклама и акции платформы</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 24 }}>
        Запускайте отдельно клиентам автосервисов или самим владельцам автосервисов.
      </p>

      <form onSubmit={create} style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className={s.tab} data-active={audience === 'CLIENTS'}
            onClick={() => setAudience('CLIENTS')} style={{ flex: 1, border: '1px solid var(--wire)', borderRadius: 8 }}>
            👤 Клиентам
          </button>
          <button type="button" className={s.tab} data-active={audience === 'OWNERS'}
            onClick={() => setAudience('OWNERS')} style={{ flex: 1, border: '1px solid var(--wire)', borderRadius: 8 }}>
            🏢 Автосервисам
          </button>
        </div>
        <input placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--wire)', background: 'var(--cage)', color: 'var(--chalk)' }} />
        <textarea placeholder="Текст акции" value={body} onChange={e => setBody(e.target.value)} rows={3}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--wire)', background: 'var(--cage)', color: 'var(--chalk)', resize: 'vertical' }} />
        <label style={{ fontSize: 13, color: 'var(--dust)' }}>
          Картинка (необязательно, до 500КБ)
          <input type="file" accept="image/*" style={{ display: 'block', marginTop: 6 }}
            onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        {image && <img src={image} alt="превью" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--wire)' }} />}
        {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}
        <button className={s.tab} disabled={saving} type="submit" style={{ border: '1px solid var(--wire)', borderRadius: 8 }}>
          {saving ? '…' : '+ Опубликовать'}
        </button>
      </form>

      {loading ? <div className={s.loading}>Загрузка…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {promos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12,
              padding: 14, border: '1px solid var(--wire)', borderRadius: 10, background: 'var(--plate)' }}>
              {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--ore)', fontWeight: 700, marginBottom: 3 }}>
                  {p.audience === 'OWNERS' ? '🏢 АВТОСЕРВИСАМ' : '👤 КЛИЕНТАМ'}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--chalk)', marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ash)' }}>{p.body}</div>
              </div>
              <button onClick={() => remove(p.id)}
                style={{ background: 'none', border: 'none', color: 'var(--dust)', cursor: 'pointer', flexShrink: 0 }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {promos.length === 0 && <div style={{ color: 'var(--dust)' }}>Акций пока нет</div>}
        </div>
      )}
    </div>
  );
}
