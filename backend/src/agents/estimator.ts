import { DiagResult, OEMPart } from './diagnostician';
import { priceOrderItems, calcOrderTotals, PricedItem } from '../services/pricingEngine';
import { prisma } from '../utils/prisma';
import { PartCategory } from '@prisma/client';

export interface OrderEstimate {
  items:       PricedItem[];
  totalCost:   number;
  totalRetail: number;
  margin:      number;
  marginPct:   number;
}

// Стоимость нормо-часа по типу работ (руб)
const LABOR_RATES: Record<string, number> = {
  MECHANIC:     2800,
  ELECTRICIAN:  3200,
  DIAGNOSTICS:  1500,
};

export async function buildEstimate(
  diagResult: DiagResult,
  specialistType: 'MECHANIC' | 'ELECTRICIAN' | 'DIAGNOSTICS',
  orderId: string
): Promise<OrderEstimate> {
  const topHypothesis = diagResult.hypotheses[0];
  if (!topHypothesis) throw new Error('Нет гипотез для оценки');

  const rate = LABOR_RATES[specialistType] ?? 2800;

  // Стоимость работ (нормо-часы → рубли)
  const laborCostMin = Math.round((topHypothesis.laborMin / 60) * rate);
  const laborCostMax = Math.round((topHypothesis.laborMax / 60) * rate);
  const laborCost    = Math.round((laborCostMin + laborCostMax) / 2);

  // Сформировать список позиций
  const rawItems: Array<{
    name: string; type: 'WORK' | 'PART'; article?: string;
    qty: number; costPrice: number; category?: PartCategory;
  }> = [
    {
      name:      topHypothesis.title + ' (работа)',
      type:      'WORK',
      qty:       1,
      costPrice: laborCost,
    },
    ...topHypothesis.partsNeeded.map((p: OEMPart) => ({
      name:      p.name,
      type:      'PART' as const,
      article:   p.oemNumber,
      qty:       p.qty,
      costPrice: Math.round(p.estimatedCostRub * 0.7), // обратный расчёт закупочной
      category:  p.category as PartCategory,
    })),
  ];

  const pricedItems = await priceOrderItems(rawItems);
  const totals      = calcOrderTotals(pricedItems);

  // Сохранить позиции в БД
  await prisma.orderItem.createMany({
    data: pricedItems.map(item => ({
      orderId,
      type:       item.type,
      name:       item.name,
      article:    item.article,
      qty:        item.qty,
      costPrice:  item.costPrice,
      retailPrice: item.retailPrice,
      markup:     item.markup,
    })),
  });

  // Обновить итоги заказа
  await prisma.order.update({
    where: { id: orderId },
    data:  {
      totalCost:   totals.totalCost,
      totalRetail: totals.totalRetail,
      status:      'ASSESSED',
    },
  });

  return { items: pricedItems, ...totals };
}
