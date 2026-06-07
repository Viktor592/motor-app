/**
 * Налоговый AI-агент МОТОР
 * - Расчёт налогов по всем режимам
 * - Сравнение и выбор оптимального режима
 * - Рекомендации по легальной оптимизации
 * - Формирование КУДиР
 * - XML-декларации УСН
 */

import { getAiClient } from './aiProvider';

// ── Налоговые режимы ──────────────────────────────────────────

export type TaxSystem =
  | 'USN_INCOME'          // УСН 6% с доходов
  | 'USN_INCOME_MINUS'    // УСН 15% доходы минус расходы
  | 'PATENT'              // Патентная система (ПСН)
  | 'OSNO'                // ОСНО (общая система)
  | 'NPD'                 // Налог на профдоход (самозанятый)

export interface TaxParams {
  system:        TaxSystem;
  region:        string;   // код региона: 77=Москва, 78=СПб
  revenue:       number;   // выручка за период ₽
  expenses:      number;   // расходы за период ₽
  employees:     number;   // кол-во сотрудников
  insuredAmount: number;   // страховые взносы ИП за себя ₽
  patentCost?:   number;   // стоимость патента (если ПСН)
  period:        'quarter' | 'year';
}

export interface TaxResult {
  system:         TaxSystem;
  systemName:     string;
  taxBase:        number;
  taxRate:        number;
  taxAmount:      number;   // налог до вычетов
  deductions:     number;   // вычеты (страховые взносы и т.д.)
  finalTax:       number;   // итоговый налог к уплате
  effectiveRate:  number;   // эффективная ставка % от выручки
  netProfit:      number;   // чистая прибыль
  details:        string[]; // пояснения по расчёту
}

// Ставки страховых взносов ИП за себя (2024)
const FIXED_INSURANCE_2024 = 49500; // фиксированная часть в год
const INCOME_INSURANCE_RATE = 0.01; // 1% с дохода свыше 300 000 ₽
const MAX_INCOME_INSURANCE  = 277_571; // максимум за год

// ── Расчётный модуль ──────────────────────────────────────────

function calcInsurance(revenue: number, provided: number): number {
  if (provided > 0) return provided;
  const variable = Math.min(Math.max(0, revenue - 300_000) * INCOME_INSURANCE_RATE, MAX_INCOME_INSURANCE);
  return FIXED_INSURANCE_2024 + variable;
}

export function calculateTax(params: TaxParams): TaxResult {
  const insurance = calcInsurance(params.revenue, params.insuredAmount);
  const periodK   = params.period === 'quarter' ? 0.25 : 1;

  switch (params.system) {

    case 'USN_INCOME': {
      const regionRate = getUsnRate(params.region, 'income'); // 1–6%
      const rawTax     = params.revenue * regionRate / 100;
      // Вычет страховых взносов: до 50% налога если есть сотрудники, до 100% если ИП без сотрудников
      const maxDeduct  = params.employees > 0 ? rawTax * 0.5 : rawTax;
      const deductions = Math.min(insurance * periodK, maxDeduct);
      const finalTax   = Math.max(0, rawTax - deductions);
      return {
        system:        'USN_INCOME',
        systemName:    `УСН «Доходы» ${regionRate}%`,
        taxBase:       params.revenue,
        taxRate:       regionRate,
        taxAmount:     rawTax,
        deductions,
        finalTax,
        effectiveRate: params.revenue > 0 ? +(finalTax / params.revenue * 100).toFixed(2) : 0,
        netProfit:     params.revenue - params.expenses - finalTax - insurance * periodK,
        details: [
          `Ставка в вашем регионе: ${regionRate}%`,
          `Налог до вычетов: ${fmtRub(rawTax)}`,
          `Вычет страх. взносов: ${fmtRub(deductions)}`,
          `Итого налог: ${fmtRub(finalTax)}`,
          params.employees === 0 ? 'ИП без сотрудников — вычет 100% взносов' : 'С сотрудниками — вычет до 50% налога',
        ],
      };
    }

    case 'USN_INCOME_MINUS': {
      const regionRate = getUsnRate(params.region, 'income_minus'); // 5–15%
      const taxBase    = Math.max(0, params.revenue - params.expenses - insurance * periodK);
      const rawTax     = taxBase * regionRate / 100;
      // Минимальный налог — 1% от выручки
      const minTax     = params.revenue * 0.01;
      const finalTax   = Math.max(rawTax, minTax);
      return {
        system:        'USN_INCOME_MINUS',
        systemName:    `УСН «Доходы − Расходы» ${regionRate}%`,
        taxBase,
        taxRate:       regionRate,
        taxAmount:     rawTax,
        deductions:    insurance * periodK,
        finalTax,
        effectiveRate: params.revenue > 0 ? +(finalTax / params.revenue * 100).toFixed(2) : 0,
        netProfit:     params.revenue - params.expenses - finalTax - insurance * periodK,
        details: [
          `Ставка в регионе: ${regionRate}%`,
          `Налоговая база (доходы − расходы − взносы): ${fmtRub(taxBase)}`,
          rawTax < minTax ? `Применён минимальный налог 1%: ${fmtRub(minTax)}` : `Расчётный налог: ${fmtRub(rawTax)}`,
          'Расходы должны быть документально подтверждены',
        ],
      };
    }

    case 'PATENT': {
      const patentCost = params.patentCost ?? estimatePatentCost(params.region);
      const annualCost = patentCost * periodK;
      // Вычет взносов из стоимости патента (как в УСН «Доходы»)
      const maxDeduct  = params.employees > 0 ? annualCost * 0.5 : annualCost;
      const deductions = Math.min(insurance * periodK, maxDeduct);
      const finalTax   = Math.max(0, annualCost - deductions);
      return {
        system:        'PATENT',
        systemName:    'ПСН (патент)',
        taxBase:       params.revenue,
        taxRate:       0,
        taxAmount:     annualCost,
        deductions,
        finalTax,
        effectiveRate: params.revenue > 0 ? +(finalTax / params.revenue * 100).toFixed(2) : 0,
        netProfit:     params.revenue - params.expenses - finalTax - insurance * periodK,
        details: [
          `Стоимость патента: ${fmtRub(patentCost)}/год`,
          `Вычет страх. взносов: ${fmtRub(deductions)}`,
          'Не нужно считать доходы — фиксированный платёж',
          'Выгоден при высокой выручке',
          'Ограничение: выручка ≤ 60 млн ₽/год, ≤ 15 сотрудников',
        ],
      };
    }

    case 'NPD': {
      // Самозанятый: 4% с физ.лиц, 6% с юр.лиц. Только без сотрудников, доход ≤ 2.4 млн
      const ratePhys = 4; const rateJur = 6;
      // Предполагаем 70% оборота с физ.лиц для автосервиса
      const fromPhys = params.revenue * 0.7;
      const fromJur  = params.revenue * 0.3;
      const rawTax   = fromPhys * ratePhys / 100 + fromJur * rateJur / 100;
      // Налоговый вычет 10 000 ₽ (однократно в жизни)
      const finalTax = Math.max(0, rawTax - 0); // уже использован
      return {
        system:        'NPD',
        systemName:    'НПД (самозанятый)',
        taxBase:       params.revenue,
        taxRate:       4.6, // смешанный
        taxAmount:     rawTax,
        deductions:    0,
        finalTax,
        effectiveRate: params.revenue > 0 ? +(finalTax / params.revenue * 100).toFixed(2) : 0,
        netProfit:     params.revenue - params.expenses - finalTax,
        details: [
          '4% с физических лиц, 6% с юридических лиц',
          'Нельзя нанимать сотрудников',
          'Лимит дохода: 2.4 млн ₽/год',
          'Не нужно платить страховые взносы за себя',
          params.revenue > 2_400_000 ? '⚠️ Превышен лимит НПД 2.4 млн/год!' : '',
        ].filter(Boolean),
      };
    }

    case 'OSNO':
    default: {
      // ОСНО: НДФЛ 13% для ИП или налог на прибыль 20% для ООО + НДС 20%
      const profitBase = Math.max(0, params.revenue - params.expenses - insurance * periodK);
      const nds        = params.revenue * 0.2 / 1.2; // НДС в составе выручки
      const rawTax     = profitBase * 0.13; // НДФЛ для ИП
      const finalTax   = rawTax + nds;
      return {
        system:        'OSNO',
        systemName:    'ОСНО',
        taxBase:       profitBase,
        taxRate:       13,
        taxAmount:     rawTax,
        deductions:    0,
        finalTax,
        effectiveRate: params.revenue > 0 ? +(finalTax / params.revenue * 100).toFixed(2) : 0,
        netProfit:     params.revenue - params.expenses - finalTax - insurance * periodK,
        details: [
          'НДФЛ 13% (для ИП) или налог на прибыль 20% (для ООО)',
          `НДС ~${fmtRub(nds)} (20% в составе выручки)`,
          'Сложный учёт — нужен бухгалтер',
          'Выгодно при работе с НДС-компаниями',
        ],
      };
    }
  }
}

// ── AI-агент оптимизации ──────────────────────────────────────

export async function analyzeTaxOptimization(params: TaxParams): Promise<{
  results:       TaxResult[];
  bestSystem:    TaxSystem;
  savings:       number;
  aiRecommendation: string;
  legalTips:     string[];
  warnings:      string[];
}> {
  // Считаем по всем режимам
  const systems: TaxSystem[] = ['USN_INCOME', 'USN_INCOME_MINUS', 'PATENT', 'NPD', 'OSNO'];
  const results = systems.map(s => calculateTax({ ...params, system: s }));

  // Находим лучший (минимальный налог)
  const best    = results.reduce((a, b) => a.finalTax < b.finalTax ? a : b);
  const worst   = results.reduce((a, b) => a.finalTax > b.finalTax ? a : b);
  const savings = worst.finalTax - best.finalTax;

  // AI-рекомендация
  const ai = await getAiClient();
  const prompt = `Ты налоговый консультант автосервиса. Данные за период:
- Выручка: ${fmtRub(params.revenue)}
- Расходы: ${fmtRub(params.expenses)}
- Сотрудников: ${params.employees}
- Регион: ${params.region}

Результаты расчёта по режимам:
${results.map(r => `${r.systemName}: налог ${fmtRub(r.finalTax)}, ставка ${r.effectiveRate}%, чистая прибыль ${fmtRub(r.netProfit)}`).join('\n')}

Оптимальный режим: ${best.systemName} (налог ${fmtRub(best.finalTax)}).

Напиши:
1. Краткую рекомендацию почему именно этот режим выгоден (2-3 предложения)
2. 3-5 законных способов уменьшить налоговую нагрузку для автосервиса
3. Предупреждения о рисках (если есть)

Важно: только легальные методы. Никакой "серой" оптимизации.
Отвечай кратко и по-русски.`;

  const aiText = await ai.complete(prompt, { maxTokens: 500, temperature: 0.4 });

  // Законные советы по оптимизации
  const legalTips = [
    'Вовремя платите страховые взносы — уменьшают налог УСН до 100%',
    'Фиксируйте ВСЕ расходы на запчасти, инструменты, аренду с документами',
    'Используйте инвестиционный вычет при покупке оборудования',
    'Применяйте региональную льготную ставку (проверьте закон своего региона)',
    'При выручке до 2.4 млн — рассмотрите НПД (самозанятость)',
    params.employees === 0 ? 'Без сотрудников — вычет 100% страховых взносов из налога УСН' : '',
    params.expenses / params.revenue > 0.6 ? 'Высокие расходы (>60%) — УСН 15% может быть выгоднее УСН 6%' : '',
  ].filter(Boolean) as string[];

  const warnings: string[] = [];
  if (params.revenue > 60_000_000) warnings.push('⚠️ Выручка >60 млн — ПСН и НПД недоступны');
  if (params.revenue > 150_000_000) warnings.push('⚠️ Выручка >150 млн — УСН недоступна, нужна ОСНО');
  if (params.employees > 100) warnings.push('⚠️ Более 100 сотрудников — УСН недоступна');
  if (params.employees > 15) warnings.push('⚠️ Более 15 сотрудников — ПСН недоступна');

  return {
    results,
    bestSystem:       best.system,
    savings,
    aiRecommendation: aiText,
    legalTips,
    warnings,
  };
}

// ── КУДиР ─────────────────────────────────────────────────────

export interface KudirData {
  year:     number;
  orgName:  string;
  inn:      string;
  taxSystem:TaxSystem;
  entries:  { date: Date; docNumber: string; docDate: Date; operation: string; income?: number; expense?: number }[];
}

export function generateKudirXml(data: KudirData): string {
  const rows = data.entries.map((e, i) => `
    <Строка>
      <НомерПП>${i + 1}</НомерПП>
      <ДатаОперации>${e.date.toLocaleDateString('ru-RU')}</ДатаОперации>
      <НомерДок>${e.docNumber}</НомерДок>
      <ДатаДок>${e.docDate.toLocaleDateString('ru-RU')}</ДатаДок>
      <СодержаниеОперации>${e.operation}</СодержаниеОперации>
      ${e.income  ? `<СуммаДохода>${e.income.toFixed(2)}</СуммаДохода>` : '<СуммаДохода>-</СуммаДохода>'}
      ${e.expense ? `<СуммаРасхода>${e.expense.toFixed(2)}</СуммаРасхода>` : '<СуммаРасхода>-</СуммаРасхода>'}
    </Строка>`).join('');

  const totalIncome  = data.entries.reduce((s, e) => s + (e.income  ?? 0), 0);
  const totalExpense = data.entries.reduce((s, e) => s + (e.expense ?? 0), 0);

  return `<?xml version="1.0" encoding="windows-1251"?>
<КнигаУчетаДоходовРасходов xmlns="http://www.nalog.ru/elvsrf/КУДиР">
  <НалогоплательщикВид>ИП</НалогоплательщикВид>
  <НаименованиеОрганизации>${data.orgName}</НаименованиеОрганизации>
  <ИНН>${data.inn}</ИНН>
  <ОбъектНалогообложения>${data.taxSystem === 'USN_INCOME' ? 'Доходы' : 'Доходы минус расходы'}</ОбъектНалогообложения>
  <НалоговыйПериод>${data.year}</НалоговыйПериод>
  <РазделI>
    ${rows}
    <Итого>
      <ИтогоДоходов>${totalIncome.toFixed(2)}</ИтогоДоходов>
      <ИтогоРасходов>${totalExpense.toFixed(2)}</ИтогоРасходов>
    </Итого>
  </РазделI>
</КнигаУчетаДоходовРасходов>`;
}

// ── XML-декларация УСН ────────────────────────────────────────

export function generateUsnDeclarationXml(opts: {
  year:         number;
  orgName:      string;
  inn:          string;
  kpp?:         string;
  okato:        string;  // код ОКТМО
  taxSystem:    'USN_INCOME' | 'USN_INCOME_MINUS';
  revenue:      number;
  expenses?:    number;
  taxRate:      number;
  taxAmount:    number;
  advancePaid:  number;
  insurance:    number;
  employees:    number;
}): string {
  const now = new Date();
  return `<?xml version="1.0" encoding="windows-1251"?>
<Файл ИдФайл="USN_${opts.inn}_${opts.year}_${now.getTime()}"
      ВерсПрог="МОТОР 1.0"
      ВерсФорм="5.11"
      xmlns="http://www.nalog.ru/elvsrf/УСН">
  <Документ КНД="1152017" ДатаДок="${now.toLocaleDateString('ru-RU')}"
            Период="34" ОтчетГод="${opts.year}"
            НаимМО="${opts.orgName}" НМО="${opts.okato}">
    <СвНП>
      <НПФЛ ИННФЛ="${opts.inn}" НаимИП="${opts.orgName}"/>
    </СвНП>
    <ПодпСвед ДатаПодп="${now.toLocaleDateString('ru-RU')}" НаимОрг="${opts.orgName}"/>
    <УСН ОбъектНО="${opts.taxSystem === 'USN_INCOME' ? '1' : '2'}"
         СтавкаНал="${opts.taxRate}">
      <!-- Раздел 2: Расчёт налога -->
      <РасчётНалога>
        <СуммаДоход>${Math.round(opts.revenue)}</СуммаДоход>
        ${opts.expenses ? `<СуммаРасход>${Math.round(opts.expenses)}</СуммаРасход>` : ''}
        <НалБаза>${Math.round(opts.taxSystem === 'USN_INCOME' ? opts.revenue : Math.max(0, opts.revenue - (opts.expenses ?? 0)))}</НалБаза>
        <НалИсчисл>${Math.round(opts.taxAmount)}</НалИсчисл>
        <НалВычет>${Math.round(opts.insurance)}</НалВычет>
        <НалУплата>${Math.round(Math.max(0, opts.taxAmount - opts.insurance))}</НалУплата>
        <АвансУплач>${Math.round(opts.advancePaid)}</АвансУплач>
        <НалДопл>${Math.round(Math.max(0, opts.taxAmount - opts.insurance - opts.advancePaid))}</НалДопл>
      </РасчётНалога>
    </УСН>
  </Документ>
</Файл>`;
}

// ── Вспомогательные ───────────────────────────────────────────

function getUsnRate(region: string, type: 'income' | 'income_minus'): number {
  // Пониженные ставки для отдельных регионов (данные 2024)
  const incomeRates: Record<string, number> = {
    '02': 5, '05': 5, '06': 5, '07': 5, '08': 5, '09': 5,
    '10': 5, '11': 5, '15': 5, '20': 5, '91': 4, '92': 4,
  };
  const incomeMinusRates: Record<string, number> = {
    '02': 5, '05': 5, '06': 5, '07': 5, '08': 5, '09': 5,
    '10': 5, '11': 5, '15': 5, '20': 5, '91': 5, '92': 5,
  };
  if (type === 'income')       return incomeRates[region]      ?? 6;
  if (type === 'income_minus') return incomeMinusRates[region] ?? 15;
  return 6;
}

function estimatePatentCost(region: string): number {
  // Примерная стоимость патента на техобслуживание авто (2024)
  const costs: Record<string, number> = {
    '77': 60_000,  // Москва
    '78': 48_000,  // СПб
    '50': 42_000,  // Московская обл.
    '23': 36_000,  // Краснодар
  };
  return costs[region] ?? 25_000;
}

const fmtRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
