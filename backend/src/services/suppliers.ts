/**
 * Сервис поставщиков — поиск запчастей по артикулу
 * Exist.ru и Autodoc.ru (REST API)
 */

interface SupplierSearchResult {
  article:   string;
  name:      string;
  brand:     string;
  price:     number;
  qty:       number;
  deliveryDays: number;
  supplier:  string;
}

// ══════════════════════════════════════
// EXIST.RU
// ══════════════════════════════════════
async function searchExist(apiKey: string, article: string): Promise<SupplierSearchResult[]> {
  try {
    // Exist API: GET https://exist.ru/api/search?article=...
    const url = `https://exist.ru/api/v1/parts/search?article=${encodeURIComponent(article)}`;
    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      console.warn(`[Exist] HTTP ${resp.status}`);
      return [];
    }

    const data = await resp.json() as any;
    const items = data.items ?? data.results ?? [];

    return items.map((item: any) => ({
      article:      item.article ?? article,
      name:         item.name ?? item.description ?? '',
      brand:        item.brand ?? item.manufacturer ?? '',
      price:        parseFloat(item.price ?? item.cost ?? 0),
      qty:          parseInt(item.qty ?? item.quantity ?? 0),
      deliveryDays: parseInt(item.delivery_days ?? item.days ?? 1),
      supplier:     'Exist.ru',
    }));
  } catch (err) {
    console.error('[Exist] search error:', err);
    return [];
  }
}

// ══════════════════════════════════════
// AUTODOC.RU
// ══════════════════════════════════════
async function searchAutodoc(apiKey: string, article: string): Promise<SupplierSearchResult[]> {
  try {
    // Autodoc API: POST https://webapi.autodoc.ru/api/spareparts
    const resp = await fetch('https://webapi.autodoc.ru/api/spareparts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ article, lang: 'ru' }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      console.warn(`[Autodoc] HTTP ${resp.status}`);
      return [];
    }

    const data = await resp.json() as any;
    const items = data.items ?? [];

    return items.map((item: any) => ({
      article:      item.article ?? article,
      name:         item.name ?? '',
      brand:        item.brand ?? '',
      price:        parseFloat(item.price ?? 0),
      qty:          parseInt(item.stock ?? 0),
      deliveryDays: parseInt(item.delivery ?? 1),
      supplier:     'Autodoc.ru',
    }));
  } catch (err) {
    console.error('[Autodoc] search error:', err);
    return [];
  }
}

// ══════════════════════════════════════
// MOCK (для разработки без реального API)
// ══════════════════════════════════════
function mockSearch(article: string, supplierName: string): SupplierSearchResult[] {
  return [
    {
      article,
      name:         `Запчасть ${article} (оригинал)`,
      brand:        'OEM',
      price:        Math.round(500 + Math.random() * 2000),
      qty:          Math.floor(1 + Math.random() * 20),
      deliveryDays: 1,
      supplier:     supplierName,
    },
    {
      article:      `${article}-ALT`,
      name:         `Запчасть ${article} (аналог)`,
      brand:        'Aftermarket',
      price:        Math.round(200 + Math.random() * 800),
      qty:          Math.floor(5 + Math.random() * 50),
      deliveryDays: 2,
      supplier:     supplierName,
    },
  ];
}

// ══════════════════════════════════════
// РОУТЕР
// ══════════════════════════════════════
export async function searchSupplier(
  supplier: { type: string; apiKey: string | null; name: string },
  article: string
): Promise<SupplierSearchResult[]> {
  // Если нет API ключа — возвращаем мок-данные для разработки
  if (!supplier.apiKey) {
    console.info(`[Suppliers] No API key for ${supplier.name}, returning mock data`);
    return mockSearch(article, supplier.name);
  }

  switch (supplier.type) {
    case 'EXIST':
      return searchExist(supplier.apiKey, article);
    case 'AUTODOC':
      return searchAutodoc(supplier.apiKey, article);
    default:
      return [];
  }
}
