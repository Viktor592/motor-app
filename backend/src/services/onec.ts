/**
 * Интеграция с 1С:Предприятие через HTTP-сервис
 *
 * Настройка на стороне 1С:
 * 1. Конфигуратор → HTTP-сервисы → создать сервис "motor"
 * 2. Методы: POST /order, POST /client, POST /payment, GET /price-list
 * 3. Публикация на веб-сервере (Apache/IIS)
 * URL итогом: http://server/base_name/hs/motor/
 */

export interface OneCOrder {
  number:      string;
  date:        string;       // ISO
  clientName:  string;
  clientPhone: string;
  vehicleMake: string;
  vehicleModel:string;
  vehiclePlate:string;
  works:       { name: string; qty: number; price: number }[];
  parts:       { article: string; name: string; qty: number; price: number }[];
  totalRetail: number;
  totalCost:   number;
  status:      string;
  paymentType: 'cash' | 'card' | 'sbp';
}

export interface OneCClient {
  phone:  string;
  name:   string;
  email?: string;
  inn?:   string;
}

export interface OneCPriceItem {
  article: string;
  name:    string;
  price:   number;
  stock:   number;
}

export class OneCService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(url: string, user: string, pass: string) {
    // Убрать trailing slash
    this.baseUrl = url.replace(/\/$/, '');
    this.headers = {
      'Authorization': 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'),
      'Content-Type':  'application/json; charset=utf-8',
      'Accept':        'application/json',
    };
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body:    body ? JSON.stringify(body) : undefined,
      signal:  AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`1С HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }

    const ct = resp.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return resp.json() as T;
    return {} as T;
  }

  /** Тест соединения */
  async ping(): Promise<boolean> {
    try {
      await this.request('GET', '/ping');
      return true;
    } catch { return false; }
  }

  /** Передать закрытый заказ в 1С */
  async syncOrder(order: OneCOrder): Promise<{ id1c: string }> {
    return this.request('POST', '/order', order);
  }

  /** Синхронизировать клиента */
  async syncClient(client: OneCClient): Promise<{ id1c: string }> {
    return this.request('POST', '/client', client);
  }

  /** Передать платёж */
  async syncPayment(orderId: string, amount: number, type: string): Promise<{ ok: boolean }> {
    return this.request('POST', '/payment', { orderId, amount, type });
  }

  /** Получить прайс-лист из 1С */
  async getPriceList(): Promise<OneCPriceItem[]> {
    return this.request('GET', '/price-list');
  }

  /** Выгрузить акт за период */
  async exportActs(from: string, to: string): Promise<{ url: string }> {
    return this.request('GET', `/acts?from=${from}&to=${to}`);
  }
}
