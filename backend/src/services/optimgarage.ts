/**
 * Интеграция с Оптим Гараж
 * https://optimgarage.ru — российская система управления автосервисом
 *
 * API: REST, Bearer token
 * Документация: https://optimgarage.ru/api-docs
 */

export interface OptimOrder {
  external_id:  string;   // наш ID
  client_name:  string;
  client_phone: string;
  car_make:     string;
  car_model:    string;
  car_year?:    number;
  car_plate:    string;
  car_vin?:     string;
  complaint?:   string;
  diagnosis?:   string;
  works:        { title: string; quantity: number; price: number; cost: number }[];
  parts:        { article: string; title: string; quantity: number; price: number; cost: number }[];
  status:       string;
  total:        number;
  created_at:   string;
  closed_at?:   string;
}

export interface OptimClient {
  name:    string;
  phone:   string;
  email?:  string;
  comment?: string;
}

export class OptimGarageService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(apiKey: string, url = 'https://api.optimgarage.ru/v1') {
    this.baseUrl = url.replace(/\/$/, '');
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body:    body ? JSON.stringify(body) : undefined,
      signal:  AbortSignal.timeout(12000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Оптим Гараж HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }

    return resp.json() as T;
  }

  async ping(): Promise<boolean> {
    try {
      await this.request('GET', '/health');
      return true;
    } catch { return false; }
  }

  /** Создать / обновить заказ-наряд */
  async upsertOrder(order: OptimOrder): Promise<{ id: string }> {
    return this.request('POST', '/orders/external', order);
  }

  /** Создать / обновить клиента */
  async upsertClient(client: OptimClient): Promise<{ id: string }> {
    return this.request('POST', '/clients/external', client);
  }

  /** Получить список заказов из Оптим Гараж (входящая синхронизация) */
  async getOrders(from?: string): Promise<OptimOrder[]> {
    const qs = from ? `?updated_after=${from}` : '';
    return this.request('GET', `/orders${qs}`);
  }

  /** Получить прайс-лист запчастей */
  async getParts(): Promise<{ article: string; title: string; price: number; stock: number }[]> {
    return this.request('GET', '/catalog/parts');
  }
}
