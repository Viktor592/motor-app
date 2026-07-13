import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../services/api';
import s from './AdminPage.module.css';

export default function PromotionsPage() {
  const [promos, setPromos]     = useState<any[]>([]);
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const load = () => api.get('/admin/promotions').then(r => setPromos(r.data.promotions)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 2 || body.length < 2) return;
    setSaving(true);
    try {
      await api.post('/admin/promotions', { title, body });
      setTitle(''); setBody(''); await load();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await api.delete(`/admin/promotions/${id}`);
    await load();
  };

  return (
    <div className={s.page}>
      <h1 className={s.h1}>Акции для клиентов</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 24 }}>
        Простое объявление об акции — видно только вашим клиентам. Запуском рекламы на платформе занимается администрация МОТОР.
      </p>

      <form onSubmit={create} style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        <input placeholder="Заголовок (например: Скидка 15% на ТО)" value={title} onChange={e => setTitle(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--wire)', background: 'var(--cage)', color: 'var(--chalk)' }} />
        <textarea placeholder="Текст акции" value={body} onChange={e => setBody(e.target.value)} rows={3}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--wire)', background: 'var(--cage)', color: 'var(--chalk)', resize: 'vertical' }} />
        <button className={s.tab} disabled={saving} type="submit" style={{ border: '1px solid var(--wire)', borderRadius: 8 }}>
          {saving ? '…' : '+ Опубликовать акцию'}
        </button>
      </form>

      {loading ? <div className={s.loading}>Загрузка…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {promos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12,
              padding: 14, border: '1px solid var(--wire)', borderRadius: 10, background: 'var(--plate)' }}>
              <div>
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
