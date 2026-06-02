import { PrismaClient, PartCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Кеш правил в памяти — обновляется каждые 5 минут
let rulesCache: Map<PartCategory, number> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getRules(): Promise<Map<PartCategory, number>> {
  if (rulesCache && Date.now() - cacheTime < CACHE_TTL) return rulesCache;

  const rules = await prisma.priceRule.findMany();
  rulesCache = new Map(rules.map(r => [r.category, r.markupPct]));
  cacheTime = Date.now();
  return rulesCache;
}

export function applyMarkup(costPrice: number, markupPct: number): number {
  return Math.ceil(costPrice * (1 + markupPct / 100));
}

export async function calcRetailPrice(costPrice: number, category: PartCategory): Promise<{
  retailPrice: number;
  markupPct:   number;
}> {
  const rules   = await getRules();
  const markup  = rules.get(category) ?? 30; // default 30%
  return {
    retailPrice: applyMarkup(costPrice, markup),
    markupPct:   markup,
  };
}

export interface PricedItem {
  name:       string;
  type:       'WORK' | 'PART';
  article?:   string;
  qty:        number;
  costPrice:  number;
  retailPrice: number;
  markup:     number;
  category?:  PartCategory;
}

export async function priceOrderItems(
  items: Array<{
    name:      string;
    type:      'WORK' | 'PART';
    article?:  string;
    qty:       number;
    costPrice: number;
    category?: PartCategory;
  }>
): Promise<PricedItem[]> {
  const rules = await getRules();

  return items.map(item => {
    const cat    = item.category ?? 'OEM' as PartCategory;
    const markup = item.type === 'WORK'
      ? 0                              // работы — без наценки, уже включают маржу
      : (rules.get(cat) ?? 30);
    const retail = item.type === 'WORK'
      ? item.costPrice                 // для работ costPrice == retailPrice
      : applyMarkup(item.costPrice, markup);

    return { ...item, retailPrice: retail, markup };
  });
}

export function calcOrderTotals(items: PricedItem[]): {
  totalCost:   number;
  totalRetail: number;
  margin:      number;
  marginPct:   number;
} {
  const totalCost   = items.reduce((s, i) => s + i.costPrice   * i.qty, 0);
  const totalRetail = items.reduce((s, i) => s + i.retailPrice * i.qty, 0);
  const margin      = totalRetail - totalCost;
  const marginPct   = totalCost > 0 ? Math.round((margin / totalCost) * 100) : 0;

  return { totalCost, totalRetail, margin, marginPct };
}

// Инвалидировать кеш (вызывается при обновлении правил)
export function invalidatePriceCache() {
  rulesCache = null;
  cacheTime  = 0;
}
