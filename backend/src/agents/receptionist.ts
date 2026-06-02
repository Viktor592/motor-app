import { callAIJson } from '../services/aiProvider';

export interface ParsedComplaint {
  symptoms:        string[];
  affectedSystem:  string;
  urgency:         'low' | 'medium' | 'high' | 'critical';
  recommendedSpec: 'MECHANIC' | 'ELECTRICIAN' | 'DIAGNOSTICS';
  estimatedTime:   number;
  suggestedChecks: string[];
}

const SYSTEM = `Ты — агент «Приёмщик» автосервиса МОТОР.
Твоя задача — разобрать жалобу клиента и вернуть ТОЛЬКО JSON без пояснений.

Формат ответа (строго JSON, без markdown-обёртки):
{
  "symptoms": ["список симптомов из жалобы"],
  "affectedSystem": "название системы (подвеска/двигатель/электрика/тормоза и т.д.)",
  "urgency": "low|medium|high|critical",
  "recommendedSpec": "MECHANIC|ELECTRICIAN|DIAGNOSTICS",
  "estimatedTime": число минут,
  "suggestedChecks": ["что проверить мастеру"]
}

Правила выбора специалиста:
- DIAGNOSTICS: горит check engine / любые коды ошибок / непонятный симптом
- ELECTRICIAN: не заводится / проблемы с аккумулятором / глючит электроника / ЭБУ
- MECHANIC: всё остальное (подвеска / тормоза / двигатель / ходовая / ТО)

Степень срочности:
- critical: тормоза / рулевое / утечка масла / перегрев
- high: стук при движении / нестабильная работа двигателя
- medium: вибрация / посторонние звуки / расход топлива
- low: плановое ТО / косметические проблемы`;

export async function parseComplaint(complaintText: string): Promise<ParsedComplaint> {
  return callAIJson<ParsedComplaint>(
    SYSTEM,
    [{ role: 'user', content: complaintText }],
    512
  );
}
