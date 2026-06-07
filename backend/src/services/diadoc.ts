/**
 * Контур.Диадок — интеграция ЭДО
 * Документация: https://developer.kontur.ru/doc/diadoc
 *
 * Для работы нужен:
 * 1. Аккаунт в Диадоке
 * 2. API-ключ (интеграционный)
 * 3. BoxId организации
 */

const DIADOC_BASE = 'https://diadoc-api.kontur.ru';

export interface DiadocDocument {
  DocumentType: string;
  FileName:     string;
  Content:      string; // base64
}

export interface DiadocCounterparty {
  BoxId?:    string;
  Inn:       string;
  Kpp?:      string;
  Name:      string;
}

export class DiadocService {
  private token:  string;
  private boxId:  string;
  private authHeader: string;

  constructor(token: string, boxId: string) {
    this.token  = token;
    this.boxId  = boxId;
    this.authHeader = `DiadocAuth ddauth_api_client_id=${token}`;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const resp = await fetch(`${DIADOC_BASE}${path}`, {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Диадок HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }
    return resp.json() as T;
  }

  /** Тест соединения */
  async ping(): Promise<boolean> {
    try {
      await this.request('GET', `/V3/GetBox?boxId=${this.boxId}`);
      return true;
    } catch { return false; }
  }

  /** Получить список контрагентов */
  async getCounterparties(): Promise<DiadocCounterparty[]> {
    const data = await this.request<any>('GET', `/V3/GetCounteragents?myBoxId=${this.boxId}`);
    return data.Counteragents ?? [];
  }

  /** Отправить документ (акт/УПД) */
  async sendDocument(opts: {
    toBoxId:      string;
    docType:      'Act' | 'Invoice' | 'UniversalTransferDocument';
    fileName:     string;
    contentBase64:string;
  }): Promise<{ messageId: string; entityId: string }> {
    const message = {
      FromBoxId: this.boxId,
      ToBoxId:   opts.toBoxId,
      PatchedContent: [{
        TypeNamedId: opts.docType,
        FileName:    opts.fileName,
        Content:     opts.contentBase64,
      }],
    };
    const result = await this.request<any>('POST', '/V3/PostMessagePatch', message);
    return { messageId: result.MessageId, entityId: result.Entities?.[0]?.EntityId };
  }

  /** Получить входящие документы */
  async getInboxDocuments(fromDate?: Date): Promise<any[]> {
    const after = fromDate?.toISOString() ?? new Date(Date.now() - 86400000 * 7).toISOString();
    const data  = await this.request<any>('GET',
      `/V3/GetDocuments?boxId=${this.boxId}&filterCategory=InboundUnsigned&timestampFromTicks=${Date.parse(after)}`
    );
    return data.Documents ?? [];
  }
}
