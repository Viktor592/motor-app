import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { callAI } from '../services/aiProvider';
import { prisma } from '../utils/prisma';

export const diagRouter = Router();

// ══════════════════════════════════════
// ИТЕРАЦИЯ 14 — AI-ДИАГНОСТИКА v2
// ══════════════════════════════════════

// POST /api/v1/diag/voice — транскрибировать голосовую жалобу
// (base64 audio → текст жалобы через Whisper/Groq)
diagRouter.post('/voice', authenticate, authorize('ADMIN','RECEPTIONIST','MASTER'), async (req, res, next) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = z.object({
      audioBase64: z.string().min(10),
      mimeType:    z.string().default('audio/webm'),
    }).parse(req.body);

    

    // Groq Whisper API
    if (process.env.GROQ_API_KEY) {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const formData   = new FormData();
      const blob       = new Blob([audioBuffer], { type: mimeType });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'ru');
      formData.append('response_format', 'json');

      const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body:    formData,
      });

      if (resp.ok) {
        const data = await resp.json() as { text: string };
        return res.json({ text: data.text, source: 'whisper' });
      }
    }

    // Fallback: попросить AI извлечь жалобу из текста
    return res.json({ text: '', source: 'none', error: 'Groq Whisper недоступен' });
  } catch (e) { next(e); }
});

// POST /api/v1/diag/photo — диагноз по фотографии
diagRouter.post('/photo', authenticate, authorize('ADMIN','RECEPTIONIST','MASTER'), async (req, res, next) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', context } = z.object({
      imageBase64: z.string().min(10),
      mimeType:    z.string().default('image/jpeg'),
      context:     z.string().optional(), // доп. контекст: марка авто, жалоба
    }).parse(req.body);

    

    // Пробуем vision-модель через OpenRouter (llava или gpt-4o)
    const systemPrompt = `Ты — опытный автодиагност. Анализируй изображение и определи:
1. Что изображено (деталь, узел, поверхность)
2. Видимые дефекты, износ, повреждения
3. Предполагаемые причины
4. Рекомендуемые работы
5. Срочность (критично / скоро / плановое)

Отвечай в формате JSON:
{
  "component": "название узла/детали",
  "defects": ["дефект1", "дефект2"],
  "causes": ["причина1"],
  "recommendations": ["работа1", "работа2"],
  "urgency": "critical|soon|planned",
  "confidence": 0.85
}`;

    const userContent: any[] = [
      {
        type:      'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}` },
      },
      {
        type: 'text',
        text: context
          ? `Контекст: ${context}\n\nПроанализируй изображение и дай диагноз в JSON.`
          : 'Проанализируй изображение и дай диагноз в JSON.',
      },
    ];

    let result: any = null;

    // Попытка через OpenRouter (vision-модели)
    if (process.env.OPENROUTER_API_KEY) {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model:    'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userContent },
          ],
          max_tokens:  800,
          temperature: 0.2,
        }),
      });

      if (resp.ok) {
        const data   = await resp.json() as any;
        const raw    = data.choices?.[0]?.message?.content ?? '';
        const cleaned = raw.replace(/```json|```/g, '').trim();
        try { result = JSON.parse(cleaned); } catch {}
      }
    }

    // Fallback: текстовый анализ без картинки
    if (!result) {
      result = {
        component:       'Не определено',
        defects:         ['Требуется визуальный осмотр'],
        causes:          ['Vision API недоступен'],
        recommendations: ['Провести ручную диагностику'],
        urgency:         'planned',
        confidence:      0,
        fallback:        true,
      };
    }

    res.json(result);
  } catch (e) { next(e); }
});

// POST /api/v1/diag/parts-suggest — подбор аналогов запчастей
diagRouter.post('/parts-suggest', authenticate, authorize('ADMIN','RECEPTIONIST','MASTER'), async (req, res, next) => {
  try {
    const { article, name, vehicleMake, vehicleModel, vehicleYear } = z.object({
      article:      z.string().min(2),
      name:         z.string().optional(),
      vehicleMake:  z.string().optional(),
      vehicleModel: z.string().optional(),
      vehicleYear:  z.number().int().optional(),
    }).parse(req.body);

    

    const prompt = `Ты — агент «Снабженец» в автосервисе. 
Запчасть: артикул ${article}${name ? `, название: ${name}` : ''}.
${vehicleMake ? `Автомобиль: ${vehicleMake} ${vehicleModel ?? ''} ${vehicleYear ?? ''}` : ''}

Задача: предложи 3–5 аналогов этой запчасти разных брендов (OEM, aftermarket).
Для каждого укажи: бренд, артикул, примерная цена в рублях, качество (OEM/Premium/Standard/Economy).

Ответь ТОЛЬКО в формате JSON-массива:
[
  { "brand": "BOSCH", "article": "0451103369", "priceRub": 850, "quality": "Premium", "note": "Оригинальный производитель" },
  ...
]`;

    const raw = (await callAI("", [{ role: "user", content: prompt }], 600)).text;
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let suggestions: any[] = [];
    try {
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch {
      suggestions = [];
    }

    // Дополнительно ищем на складе
    const inStock = await prisma.part.findMany({
      where: {
        OR: [
          { article: { contains: article.slice(0, 6), mode: 'insensitive' } },
          { name:    { contains: name ?? article, mode: 'insensitive' } },
        ],
        localStock: { gt: 0 },
      },
      take: 5,
      select: { id: true, article: true, name: true, localStock: true, localCost: true },
    });

    res.json({ suggestions, inStock });
  } catch (e) { next(e); }
});

// POST /api/v1/diag/vin-history — история диагнозов по VIN
diagRouter.post('/vin-history', authenticate, authorize('ADMIN','RECEPTIONIST','MASTER'), async (req, res, next) => {
  try {
    const { vin, plate } = z.object({
      vin:   z.string().optional(),
      plate: z.string().optional(),
    }).refine(d => d.vin || d.plate, { message: 'Укажите VIN или гос. номер' })
      .parse(req.body);

    const vehicle = await prisma.vehicle.findFirst({
      where: vin ? { vin } : { plateNum: plate! },
      include: {
        orders: {
          where:   { status: 'CLOSED' },
          orderBy: { createdAt: 'desc' },
          take:    20,
          include: {
            items: { where: { type: 'WORK' } },
          },
        },
      },
    });

    if (!vehicle) {
      return res.json({ found: false, vehicle: null, history: [] });
    }

    const history = (vehicle as any).orders.map(o => ({
      orderId:     o.id,
      orderNumber: o.orderNumber,
      date:        o.createdAt,
      diagnosis:   o.diagnosis,
      works:       o.items.map(i => i.name),
      totalRetail: o.totalRetail,
    }));

    // AI: краткое резюме истории обслуживания
    let summary = '';
    if (history.length > 0) {
      
      const allWorks = history.flatMap(h => h.works).slice(0, 30);
      const prompt = `Краткое резюме истории обслуживания автомобиля ${vehicle.brand} ${vehicle.model} (${vehicle.year ?? '?'}).\n` +
        `Выполненные работы: ${allWorks.join(', ')}.\n` +
        `Напиши 2–3 предложения: что делали, на что обратить внимание при следующем визите.`;
      summary = (await callAI('', [{ role: 'user' as const, content: prompt }], 200)).text;
    }

    res.json({
      found:   true,
      vehicle: { make: vehicle.brand, model: vehicle.model, year: vehicle.year, plate: vehicle.plateNumNum, vin: vehicle.vinHashHash },
      history,
      summary,
      totalVisits:  history.length,
      totalSpent:   Math.round(history.reduce((s, h) => s + Number(h.totalRetail ?? 0), 0)),
    });
  } catch (e) { next(e); }
});
