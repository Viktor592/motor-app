/**
 * МЧД — Машиночитаемая доверенность
 * Стандарт: приказ Минцифры № 858 от 18.08.2021
 * Формат: XML по схеме ФНС / СФР / Росстат
 *
 * МЧД позволяет системе автоматически подписывать и отправлять
 * документы от имени организации без ручной подписи директора.
 *
 * Два способа:
 * 1. Через оператора ЭДО (Контур, Такском, СБИС) — они хранят МЧД
 * 2. Прямая интеграция через API ФНС (ГИС МЧД на gosuslugi.ru)
 */

import { prisma } from '../utils/prisma';

// ── Типы ─────────────────────────────────────────────────────

export interface MchDData {
  // Доверитель (организация)
  principalInn:       string;
  principalKpp?:      string;
  principalName:      string;
  principalOgrn?:     string;
  // Представитель (система/сотрудник)
  representativeInn:  string;
  representativeName: string;
  representativeSnils?:string;
  // Полномочия
  authorities:        Authority[];
  // Срок действия
  validFrom:          Date;
  validTo:            Date;
  // ID доверенности
  mchDId:             string;
}

export type Authority =
  | 'SIGN_TAX_REPORTS'      // Подписание налоговой отчётности
  | 'SIGN_SFR_REPORTS'      // Подписание отчётности в СФР
  | 'SIGN_ROSSTAT_REPORTS'  // Подписание отчётности в Росстат
  | 'SIGN_EDO_DOCS'         // Подписание ЭДО-документов
  | 'SIGN_FISCAL'           // Фискальные операции;

// Коды полномочий по классификатору ФНС
const AUTHORITY_CODES: Record<Authority, string> = {
  SIGN_TAX_REPORTS:      '1',
  SIGN_SFR_REPORTS:      '2',
  SIGN_ROSSTAT_REPORTS:  '3',
  SIGN_EDO_DOCS:         '4',
  SIGN_FISCAL:           '5',
};

// ── Генерация XML МЧД ─────────────────────────────────────────

export function generateMchDXml(data: MchDData): string {
  const authorities = data.authorities
    .map(a => `<Полномочие Код="${AUTHORITY_CODES[a]}" Наименование="${authorityName(a)}"/>`)
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Машиночитаемая доверенность (МЧД) -->
<!-- Стандарт: Приказ Минцифры России от 18.08.2021 № 858 -->
<Доверенность xmlns="urn:customs.ru:RUMachineReadablePowerOfAttorney:5.16.0"
              ИдДок="${data.mchDId}"
              ВерсФорм="5.01">

  <!-- Доверитель -->
  <Доверитель>
    <НаимОрг>${data.principalName}</НаимОрг>
    <ИННЮЛ>${data.principalInn}</ИННЮЛ>
    ${data.principalKpp  ? `<КПП>${data.principalKpp}</КПП>` : ''}
    ${data.principalOgrn ? `<ОГРН>${data.principalOgrn}</ОГРН>` : ''}
  </Доверитель>

  <!-- Представитель (система МОТОР) -->
  <Представитель>
    <НаимОрг>${data.representativeName}</НаимОрг>
    <ИНН>${data.representativeInn}</ИНН>
    ${data.representativeSnils ? `<СНИЛС>${data.representativeSnils}</СНИЛС>` : ''}
  </Представитель>

  <!-- Полномочия -->
  <СведПолн>
    ${authorities}
  </СведПолн>

  <!-- Срок действия -->
  <СрокДействия>
    <ДатаНачала>${formatDate(data.validFrom)}</ДатаНачала>
    <ДатаОкончания>${formatDate(data.validTo)}</ДатаОкончания>
  </СрокДействия>

</Доверенность>`;
}

function authorityName(a: Authority): string {
  const names: Record<Authority, string> = {
    SIGN_TAX_REPORTS:      'Представление налоговой отчётности',
    SIGN_SFR_REPORTS:      'Представление отчётности в СФР',
    SIGN_ROSSTAT_REPORTS:  'Представление отчётности в Росстат',
    SIGN_EDO_DOCS:         'Подписание документов ЭДО',
    SIGN_FISCAL:           'Фискальные операции',
  };
  return names[a];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Регистрация МЧД через API ФНС ────────────────────────────

export class FnsMchDService {
  /**
   * Вариант 1: через API Контур.Диадок (рекомендуется)
   * Диадок хранит МЧД и применяет при отправке документов
   */
  async registerViaDiadoc(opts: {
    diadocToken:   string;
    diadocBoxId:   string;
    mchDXml:       string;
    mchDId:        string;
  }): Promise<{ registered: boolean; messageId?: string }> {
    try {
      const resp = await fetch('https://diadoc-api.kontur.ru/V3/PostMachineReadablePowerOfAttorney', {
        method:  'POST',
        headers: {
          'Authorization': `DiadocAuth ddauth_api_client_id=${opts.diadocToken}`,
          'Content-Type':  'application/xml',
          'DiadocBoxId':   opts.diadocBoxId,
        },
        body:   opts.mchDXml,
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Диадок МЧД: ${resp.status} — ${text.slice(0, 200)}`);
      }

      const result = await resp.json() as any;
      return { registered: true, messageId: result.MessageId };
    } catch (e: any) {
      console.error('[МЧД Диадок]', e.message);
      return { registered: false };
    }
  }

  /**
   * Вариант 2: Прямая регистрация в ГИС МЧД ФНС
   * Требует КЭП директора для первичной регистрации (один раз!)
   * После — система работает автономно
   */
  async registerViaFns(opts: {
    mchDXml:    string;
    mchDId:     string;
    signedHash: string; // КЭП директора (base64) — нужен один раз
  }): Promise<{ registered: boolean; fnsId?: string }> {
    // ГИС МЧД: https://m4d.nalog.gov.ru
    const BASE = 'https://m4d.nalog.gov.ru/api/v1';
    try {
      const resp = await fetch(`${BASE}/mchdRegister`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mchd:      Buffer.from(opts.mchDXml).toString('base64'),
          signature: opts.signedHash,
          id:        opts.mchDId,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!resp.ok) throw new Error(`ГИС МЧД: ${resp.status}`);
      const result = await resp.json() as any;
      return { registered: true, fnsId: result.id };
    } catch (e: any) {
      console.error('[МЧД ФНС]', e.message);
      return { registered: false };
    }
  }

  /**
   * Проверить статус МЧД
   */
  async checkStatus(mchDId: string): Promise<'active' | 'expired' | 'revoked' | 'not_found'> {
    try {
      const resp = await fetch(`https://m4d.nalog.gov.ru/api/v1/mchdStatus?id=${mchDId}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) return 'not_found';
      const data = await resp.json() as any;
      return data.status ?? 'not_found';
    } catch {
      return 'not_found';
    }
  }
}
