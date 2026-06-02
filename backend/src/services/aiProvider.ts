/**
 * МОТОР — Универсальный AI-провайдер
 *
 * Приоритет (всё бесплатно):
 *   1. Groq API        — бесплатный tier, быстрый (llama-3.3-70b)
 *   2. Ollama          — локальный запуск (llama3 / mistral)
 *   3. OpenRouter      — бесплатные модели (google/gemma, meta/llama)
 *   4. Anthropic       — платный fallback если задан ANTHROPIC_API_KEY
 *
 * Настройка через .env:
 *   AI_PROVIDER=groq          # groq | ollama | openrouter | anthropic | auto
 *   GROQ_API_KEY=gsk_...      # бесплатно на console.groq.com
 *   OLLAMA_URL=http://localhost:11434
 *   OLLAMA_MODEL=llama3
 *   OPENROUTER_API_KEY=sk-or-... # бесплатно на openrouter.ai
 */

export interface AIMessage {
  role:    'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  text:     string;
  provider: string;
  model:    string;
}

// ── Groq (бесплатно, быстро, ~30 req/min) ────────────────────────────────────
async function callGroq(system: string, messages: AIMessage[], maxTokens = 1024): Promise<AIResponse> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY не задан');

  const body = {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      ...messages,
    ],
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  return {
    text:     data.choices[0].message.content,
    provider: 'groq',
    model:    data.model,
  };
}

// ── Ollama (локально, полностью бесплатно) ────────────────────────────────────
async function callOllama(system: string, messages: AIMessage[], maxTokens = 1024): Promise<AIResponse> {
  const url   = process.env.OLLAMA_URL   || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

  const body = {
    model,
    stream: false,
    options: { num_predict: maxTokens },
    messages: [
      { role: 'system', content: system },
      ...messages,
    ],
  };

  const res = await fetch(`${url}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Ollama error ${res.status}`);

  const data = await res.json() as any;
  return {
    text:     data.message?.content ?? '',
    provider: 'ollama',
    model,
  };
}

// ── OpenRouter (бесплатные модели: gemma, llama, mistral) ─────────────────────
async function callOpenRouter(system: string, messages: AIMessage[], maxTokens = 1024): Promise<AIResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY не задан');

  // Бесплатные модели на openrouter.ai (лимит: 20 req/min, 200 req/day)
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      ...messages,
    ],
  };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Authorization':  `Bearer ${key}`,
      'Content-Type':   'application/json',
      'HTTP-Referer':   'https://motor-app.ru',
      'X-Title':        'МОТОР Автосервис',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  return {
    text:     data.choices[0].message.content,
    provider: 'openrouter',
    model:    data.model,
  };
}

// ── Anthropic (платный fallback) ──────────────────────────────────────────────
async function callAnthropic(system: string, messages: AIMessage[], maxTokens = 1024): Promise<AIResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY не задан');

  const body = {
    model:      'claude-haiku-4-5-20251001', // самая дешёвая модель
    max_tokens: maxTokens,
    system,
    messages,
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'Content-Type':      'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  return {
    text:     data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(''),
    provider: 'anthropic',
    model:    data.model,
  };
}

// ── Главная функция — авто-переключение ──────────────────────────────────────
export async function callAI(
  system:    string,
  messages:  AIMessage[],
  maxTokens: number = 1024
): Promise<AIResponse> {
  const provider = (process.env.AI_PROVIDER || 'auto').toLowerCase();

  // Явный выбор провайдера
  if (provider === 'groq')       return callGroq(system, messages, maxTokens);
  if (provider === 'ollama')     return callOllama(system, messages, maxTokens);
  if (provider === 'openrouter') return callOpenRouter(system, messages, maxTokens);
  if (provider === 'anthropic')  return callAnthropic(system, messages, maxTokens);

  // Авто — пробуем по приоритету
  const providers = [
    { name: 'groq',       fn: () => callGroq(system, messages, maxTokens),       enabled: !!process.env.GROQ_API_KEY },
    { name: 'ollama',     fn: () => callOllama(system, messages, maxTokens),      enabled: true },
    { name: 'openrouter', fn: () => callOpenRouter(system, messages, maxTokens),  enabled: !!process.env.OPENROUTER_API_KEY },
    { name: 'anthropic',  fn: () => callAnthropic(system, messages, maxTokens),   enabled: !!process.env.ANTHROPIC_API_KEY },
  ];

  const errors: string[] = [];
  for (const p of providers.filter(p => p.enabled)) {
    try {
      const result = await p.fn();
      if (errors.length > 0) console.warn(`[AI] Fallback to ${p.name} after: ${errors.join(', ')}`);
      return result;
    } catch (e: any) {
      errors.push(`${p.name}: ${e.message}`);
      console.warn(`[AI] ${p.name} failed:`, e.message);
    }
  }

  throw new Error(`Все AI-провайдеры недоступны: ${errors.join(' | ')}`);
}

/**
 * Вспомогательная — вызов с автоматическим парсингом JSON из ответа
 */
export async function callAIJson<T>(
  system:    string,
  messages:  AIMessage[],
  maxTokens: number = 1024
): Promise<T> {
  const response = await callAI(system, messages, maxTokens);
  const clean    = response.text.replace(/```json|```/g, '').trim();

  // Попытка извлечь JSON если модель добавила лишний текст
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`AI не вернул JSON: ${clean.slice(0, 200)}`);

  return JSON.parse(jsonMatch[0]) as T;
}
