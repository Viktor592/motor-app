/**
 * Автоматическая отправка отчётности
 * ФНС, СФР (ранее ПФР + ФСС), Росстат
 *
 * Работает через операторов ЭДО:
 * - Контур (Экстерн API)
 * - Такском
 * - СБИС
 *
 * Требует: МЧД + КЭП системы
 */

import { generateUsnDeclarationXml, generateKudirXml } from './taxService';
import type { MchDData } from './mchd';

export type ReportType =
  | 'USN_DECLARATION'    // Декларация по УСН (ФНС)
  | 'KUDIR'              // Книга доходов и расходов
  | 'SFR_EFS1'          // ЕФС-1 в СФР (персучёт + взносы)
  | 'ROSSTAT_1MF'       // Форма 1-МФ Росстат
  | 'NDC'               // Декларация НДС (для ОСНО)

export type ReportStatus = 'QUEUED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ERROR'

export interface ReportResult {
  type:       ReportType;
  status:     ReportStatus;
  operator:   string;
  sentAt?:    Date;
  trackingId?:string;
  message?:   string;
}

// ── Контур.Экстерн API ────────────────────────────────────────

export class KonturExternService {
  private apiKey:   string;
  private innKpp:   string; // ИНН или ИНН+КПП через /
  private BASE = 'https://extern-api.testkontur.ru/v1'; // prod: extern-api.kontur.ru

  constructor(apiKey: string, inn: string, kpp?: string) {
    this.apiKey  = apiKey;
    this.innKpp  = kpp ? `${inn}/${kpp}` : inn;
  }

  private async req<T>(method: string, path: string, body?: any): Promise<T> {
    const resp = await fetch(`${this.BASE}${path}`, {
      method,
      headers: {
        'X-Auth-SID':  this.apiKey,
        'Content-Type':'application/json',
        'Accept':      'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Контур.Экстерн ${resp.status}: ${text.slice(0, 200)}`);
    }
    return resp.json() as T;
  }

  /** Получить список черновиков */
  async getDrafts(): Promise<any[]> {
    const data = await this.req<any>('GET', `/account/${this.innKpp}/drafts`);
    return data.drafts ?? [];
  }

  /** Создать черновик документа */
  async createDraft(opts: {
    recipient:   'FNS' | 'SFR' | 'ROSSTAT';
    docType:     string;
    xmlContent:  string;
    mchDId?:     string;
  }): Promise<{ draftId: string }> {
    const recipients = {
      FNS:     { code: '0087' },  // ФНС
      SFR:     { code: '0087' },  // СФР
      ROSSTAT: { code: '0087' },  // Росстат
    };

    const body = {
      payer: { inn: this.innKpp },
      recipient: recipients[opts.recipient],
      documents: [{
        description: { type: opts.docType },
        content:     Buffer.from(opts.xmlContent).toString('base64'),
        ...(opts.mchDId ? { machineReadablePowerOfAttorney: { id: opts.mchDId } } : {}),
      }],
    };

    return this.req('POST', `/account/${this.innKpp}/drafts`, body);
  }

  /** Отправить черновик */
  async sendDraft(draftId: string): Promise<{ docflowId: string }> {
    return this.req('POST', `/account/${this.innKpp}/drafts/${draftId}/send`);
  }

  /** Статус документооборота */
  async getDocflowStatus(docflowId: string): Promise<{
    status: ReportStatus; description?: string;
  }> {
    const data = await this.req<any>('GET', `/account/${this.innKpp}/docflows/${docflowId}`);
    const state = data.description?.finalStatus ?? data.status;
    const statusMap: Record<string, ReportStatus> = {
      'NO_ANSWER_TIMEOUT': 'SENT',
      'RECEIVED':          'ACCEPTED',
      'CHECKED':           'ACCEPTED',
      'FINISHED':          'ACCEPTED',
      'REFUSED':           'REJECTED',
      'ERROR':             'ERROR',
    };
    return {
      status:      statusMap[state] ?? 'QUEUED',
      description: data.description?.description,
    };
  }
}

// ── Автоматический отправщик отчётности ──────────────────────

export class AutoReportingService {
  private kontur?: KonturExternService;

  constructor(opts: {
    konturApiKey?: string;
    inn:           string;
    kpp?:          string;
  }) {
    if (opts.konturApiKey) {
      this.kontur = new KonturExternService(opts.konturApiKey, opts.inn, opts.kpp);
    }
  }

  /**
   * Автоматически отправить декларацию УСН в ФНС
   * Вызывается из scheduler по расписанию или вручную
   */
  async sendUsnDeclaration(opts: {
    year:         number;
    orgName:      string;
    inn:          string;
    kpp?:         string;
    okato:        string;
    taxSystem:    'USN_INCOME' | 'USN_INCOME_MINUS';
    revenue:      number;
    expenses?:    number;
    taxRate:      number;
    taxAmount:    number;
    advancePaid:  number;
    insurance:    number;
    mchDId?:      string;
  }): Promise<ReportResult> {
    const xml = generateUsnDeclarationXml(opts);

    if (!this.kontur) {
      // Без оператора — сохраняем файл для ручной отправки
      return {
        type:     'USN_DECLARATION',
        status:   'QUEUED',
        operator: 'manual',
        message:  'Файл готов. Настройте Контур.Экстерн для авто-отправки.',
      };
    }

    try {
      const draft = await this.kontur.createDraft({
        recipient:  'FNS',
        docType:    'Декларация_УСН',
        xmlContent: xml,
        mchDId:     opts.mchDId,
      });

      const { docflowId } = await this.kontur.sendDraft(draft.draftId);

      return {
        type:       'USN_DECLARATION',
        status:     'SENT',
        operator:   'kontur',
        sentAt:     new Date(),
        trackingId: docflowId,
        message:    'Декларация УСН отправлена в ФНС через Контур.Экстерн',
      };
    } catch (e: any) {
      return {
        type:     'USN_DECLARATION',
        status:   'ERROR',
        operator: 'kontur',
        message:  e.message,
      };
    }
  }

  /**
   * Отправить ЕФС-1 в СФР
   * Форма ЕФС-1 заменила СЗВ-ТД, СЗВ-СТАЖ, 4-ФСС с 2023 года
   */
  async sendEfs1(opts: {
    year:       number;
    quarter:    1 | 2 | 3 | 4;
    orgName:    string;
    inn:        string;
    kpp?:       string;
    regNumber:  string;   // регномер в СФР
    employees:  { snils: string; name: string; hireDate?: Date; fireDate?: Date }[];
    mchDId?:    string;
  }): Promise<ReportResult> {
    const xml = generateEfs1Xml(opts);

    if (!this.kontur) {
      return { type: 'SFR_EFS1', status: 'QUEUED', operator: 'manual',
        message: 'XML ЕФС-1 готов. Настройте оператора для авто-отправки.' };
    }

    try {
      const draft = await this.kontur.createDraft({
        recipient: 'SFR', docType: 'ЕФС-1', xmlContent: xml, mchDId: opts.mchDId,
      });
      const { docflowId } = await this.kontur.sendDraft(draft.draftId);
      return {
        type: 'SFR_EFS1', status: 'SENT', operator: 'kontur',
        sentAt: new Date(), trackingId: docflowId,
        message: 'ЕФС-1 отправлен в СФР через Контур.Экстерн',
      };
    } catch (e: any) {
      return { type: 'SFR_EFS1', status: 'ERROR', operator: 'kontur', message: e.message };
    }
  }

  /**
   * Проверить статус отправленного отчёта
   */
  async checkStatus(docflowId: string): Promise<ReportStatus> {
    if (!this.kontur) return 'QUEUED';
    const result = await this.kontur.getDocflowStatus(docflowId);
    return result.status;
  }
}

// ── XML-генераторы ────────────────────────────────────────────

function generateEfs1Xml(opts: {
  year: number; quarter: number;
  orgName: string; inn: string; kpp?: string; regNumber: string;
  employees: { snils: string; name: string; hireDate?: Date; fireDate?: Date }[];
}): string {
  const sections = opts.employees.map(emp => `
    <ЗЛ СНИЛС="${emp.snils}">
      <ФИО>${emp.name}</ФИО>
      ${emp.hireDate ? `<ДатаПриёма>${emp.hireDate.toLocaleDateString('ru-RU')}</ДатаПриёма>` : ''}
      ${emp.fireDate ? `<ДатаУвольнения>${emp.fireDate.toLocaleDateString('ru-RU')}</ДатаУвольнения>` : ''}
    </ЗЛ>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ЕФС-1 xmlns="urn:sfr:efsForm:v1" Период="${opts.year}Q${opts.quarter}">
  <Страхователь>
    <НаимОрг>${opts.orgName}</НаимОрг>
    <ИНН>${opts.inn}</ИНН>
    ${opts.kpp ? `<КПП>${opts.kpp}</КПП>` : ''}
    <РегНомерСФР>${opts.regNumber}</РегНомерСФР>
  </Страхователь>
  <РазделI>
    ${sections}
  </РазделI>
</ЕФС-1>`;
}
