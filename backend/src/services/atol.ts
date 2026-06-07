/**
 * Атол Онлайн — фискализация чеков по 54-ФЗ
 * Документация: https://online.atol.ru/possystem/v4/documentation
 *
 * Поддерживает: наличные, безнал, СБП
 * Работает с любой ОФД: Платформа ОФД, Тензор, и др.
 */

const ATOL_BASE = 'https://online.atol.ru/possystem/v4';

interface AatolItem {
  name:         string;
  price:        number;
  quantity:     number;
  sum:          number;
  tax:          { type: 'none' | 'vat0' | 'vat10' | 'vat20' };
  payment_method: 'full_payment' | 'advance' | 'credit';
  payment_object: 'service' | 'commodity';
}

interface AatolPayment {
  type:  0 | 1 | 14; // 0=наличные, 1=безнал, 14=аванс
  sum:   number;
}

export class AatolService {
  private login:    string;
  private password: string;
  private groupCode:string;
  private token:    string | null = null;
  private tokenExp: number = 0;

  constructor(login: string, password: string, groupCode: string) {
    this.login     = login;
    this.password  = password;
    this.groupCode = groupCode;
  }

  // Получить/обновить токен
  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExp) return this.token;

    const resp = await fetch(`${ATOL_BASE}/${this.groupCode}/getToken`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ login: this.login, pass: this.password }),
      signal:  AbortSignal.timeout(10000),
    });

    const data = await resp.json() as any;
    if (data.error) throw new Error(`Атол auth: ${data.error.text}`);

    this.token   = data.token;
    this.tokenExp = Date.now() + 20 * 60 * 1000; // 20 минут
    return this.token!;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const token = await this.getToken();
    const resp  = await fetch(`${ATOL_BASE}/${this.groupCode}${path}`, {
      method,
      headers: {
        'Token':        token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    const data = await resp.json() as any;
    if (data.error) throw new Error(`Атол: ${data.error.text}`);
    return data as T;
  }

  /**
   * Пробить чек прихода (продажа)
   */
  async sell(opts: {
    externalId:   string;    // наш уникальный ID (orderId)
    clientEmail?: string;
    clientPhone?: string;
    items:        AatolItem[];
    payments:     AatolPayment[];
    totalSum:     number;
  }): Promise<{ uuid: string }> {
    const receipt = {
      external_id: opts.externalId,
      receipt: {
        client: {
          email: opts.clientEmail,
          phone: opts.clientPhone,
        },
        company: {
          email:       process.env.ATOL_COMPANY_EMAIL ?? '',
          sno:         process.env.ATOL_TAX_SYSTEM ?? 'usn_income',
          inn:         process.env.ATOL_INN ?? '',
          payment_address: process.env.ATOL_ADDRESS ?? '',
        },
        items:    opts.items,
        payments: opts.payments,
        total:    opts.totalSum,
      },
      timestamp:   new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      service: {
        callback_url: `${process.env.APP_URL}/api/v1/edo/atol/webhook`,
      },
    };

    return this.request('POST', '/sell', receipt);
  }

  /**
   * Пробить чек возврата
   */
  async sellReturn(opts: {
    externalId:  string;
    items:       AatolItem[];
    payments:    AatolPayment[];
    totalSum:    number;
    clientEmail?: string;
  }): Promise<{ uuid: string }> {
    const receipt = {
      external_id: opts.externalId + '_return',
      receipt: {
        client:   { email: opts.clientEmail },
        company:  {
          sno: process.env.ATOL_TAX_SYSTEM ?? 'usn_income',
          inn: process.env.ATOL_INN ?? '',
          payment_address: process.env.ATOL_ADDRESS ?? '',
        },
        items:    opts.items,
        payments: opts.payments,
        total:    opts.totalSum,
      },
      timestamp: new Date().toLocaleString('ru-RU'),
    };

    return this.request('POST', '/sell_return', receipt);
  }

  /**
   * Получить статус чека по UUID
   */
  async getStatus(uuid: string): Promise<{
    status:  'wait' | 'done' | 'fail';
    payload: { fiscal_receipt_number?: number; fn_number?: string; ecr_registration_number?: string; fiscal_document_number?: number; fiscal_document_attribute?: number; receipt_datetime?: string; url?: string };
    error?:  { code: number; text: string };
  }> {
    return this.request('GET', `/report/${uuid}`);
  }

  /** Тест соединения */
  async ping(): Promise<boolean> {
    try { await this.getToken(); return true; }
    catch { return false; }
  }
}

/**
 * Конвертировать позиции заказа в формат Атол
 */
export function orderItemsToAtol(items: {
  name:        string;
  qty:         number;
  retailPrice: number;
  type:        string;
  costPrice?:  number;
}[], vatRate: number = 0): AatolItem[] {
  return items.map(item => ({
    name:     item.name.slice(0, 128), // макс. длина названия
    price:    Math.round(Number(item.retailPrice) * 100) / 100,
    quantity: item.qty,
    sum:      Math.round(Number(item.retailPrice) * item.qty * 100) / 100,
    tax:      { type: vatRate === 20 ? 'vat20' : vatRate === 10 ? 'vat10' : vatRate === 0 ? 'vat0' : 'none' } as any,
    payment_method: 'full_payment' as const,
    payment_object: (item.type === 'WORK' ? 'service' : 'commodity') as any,
  }));
}
