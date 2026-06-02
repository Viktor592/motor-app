import { callAIJson } from '../services/aiProvider';
import { ParsedComplaint } from './receptionist';

export interface DiagHypothesis {
  rank:        number;
  title:       string;
  probability: number;
  description: string;
  partsNeeded: OEMPart[];
  laborMin:    number;
  laborMax:    number;
}

export interface OEMPart {
  name:             string;
  oemNumber:        string;
  qty:              number;
  category:         'OIL_FILTERS' | 'OEM' | 'AFTERMARKET' | 'BRAKES' | 'BODY' | 'CHEMICALS';
  estimatedCostRub: number;
}

export interface DiagResult {
  hypotheses:    DiagHypothesis[];
  totalProbable: string;
  priorityParts: OEMPart[];
  minEstimate:   number;
  maxEstimate:   number;
}

const SYSTEM = `Ты — агент «Диагност» автосервиса МОТОР.
Получаешь разобранную жалобу клиента и возвращаешь ТОЛЬКО JSON с гипотезами и списком деталей.

Формат (строго JSON без markdown):
{
  "hypotheses": [
    {
      "rank": 1,
      "title": "Название неисправности",
      "probability": 75,
      "description": "Краткое объяснение (1-2 предложения)",
      "partsNeeded": [
        {
          "name": "Название детали",
          "oemNumber": "OEM артикул",
          "qty": 1,
          "category": "OEM|AFTERMARKET|BRAKES|OIL_FILTERS|BODY|CHEMICALS",
          "estimatedCostRub": 2500
        }
      ],
      "laborMin": 60,
      "laborMax": 120
    }
  ],
  "totalProbable": "Вероятно, проблема в ...",
  "priorityParts": [],
  "minEstimate": 3000,
  "maxEstimate": 15000
}

Правила:
- 2-3 гипотезы, сумма вероятностей ~100%
- Артикулы OEM — реальные или близкие к реальным
- Оценка стоимости — российский рынок 2025 года`;

export async function runDiagnostics(
  complaint:   ParsedComplaint,
  vehicleInfo: { brand: string; model: string; year: number; mileage?: number }
): Promise<DiagResult> {
  const prompt = `
Автомобиль: ${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}${vehicleInfo.mileage ? `, пробег ${vehicleInfo.mileage.toLocaleString('ru')} км` : ''}

Симптомы: ${complaint.symptoms.join(', ')}
Затронутая система: ${complaint.affectedSystem}
Срочность: ${complaint.urgency}
Что проверить: ${complaint.suggestedChecks.join(', ')}`;

  return callAIJson<DiagResult>(SYSTEM, [{ role: 'user', content: prompt }], 1500);
}
