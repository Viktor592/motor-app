/**
 * Генератор финансовых документов в PDF
 * Счёт на оплату, Акт выполненных работ, УПД
 * Использует PDFKit (уже есть в проекте для заказ-нарядов)
 */

import type { Response } from 'express';

export interface OrgDetails {
  name:       string;
  inn:        string;
  kpp?:       string;
  ogrn?:      string;
  address:    string;
  director?:  string;
  bankName?:  string;
  bankBik?:   string;
  bankAccount?:string;
  bankCorr?:  string;
  phone?:     string;
  email?:     string;
}

export interface ClientDetails {
  name:    string;
  inn?:    string;
  kpp?:    string;
  address?:string;
  phone?:  string;
  email?:  string;
}

export interface DocItem {
  name:        string;
  unit:        string; // шт, час, услуга
  qty:         number;
  price:       number;
  amount:      number;
  vatRate?:    number; // 0 | 20
}

export interface DocData {
  docNumber:  string;
  docDate:    Date;
  org:        OrgDetails;
  client:     ClientDetails;
  items:      DocItem[];
  totalAmount:number;
  vatAmount?: number;
  comment?:   string;
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const rubles = (n: number): string => {
  const units  = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens  = ['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  const tens   = ['','десять','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  const hundreds = ['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];
  const int    = Math.floor(n);
  const kop    = Math.round((n - int) * 100);
  // Упрощённая версия для небольших сумм
  if (int >= 1000) {
    const t = Math.floor(int / 1000);
    const r = int % 1000;
    return `${t} тысяч ${r > 0 ? r + ' ' : ''}рублей ${kop.toString().padStart(2,'0')} копеек`;
  }
  return `${int} рублей ${kop.toString().padStart(2,'0')} копеек`;
};

/**
 * Генерирует HTML-шаблон счёта/акта (для конвертации в PDF через puppeteer или wkhtmltopdf)
 * Возвращает HTML-строку — легко конвертировать или отдать как есть
 */
export function generateInvoiceHtml(data: DocData): string {
  const rows = data.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td style="text-align:right">${fmtMoney(item.qty)}</td>
      <td style="text-align:right">${fmtMoney(item.price)}</td>
      <td style="text-align:right"><strong>${fmtMoney(item.amount)}</strong></td>
      ${data.vatAmount !== undefined ? `<td style="text-align:right">${item.vatRate ? fmtMoney(item.amount * (item.vatRate / (100 + item.vatRate))) : 'Без НДС'}</td>` : ''}
    </tr>`).join('');

  const vatCol = data.vatAmount !== undefined ? '<th>НДС</th>' : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .doc-title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .doc-sub   { font-size: 12px; color: #555; }
  .bank-box  { border: 1px solid #999; padding: 8px 12px; font-size: 10px; max-width: 320px; }
  .bank-box table { width: 100%; border-collapse: collapse; }
  .bank-box td { padding: 1px 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
  .party-box { border: 1px solid #ccc; padding: 8px; }
  .party-title { font-weight: bold; font-size: 10px; color: #555; margin-bottom: 4px; text-transform: uppercase; }
  table.items { width: 100%; border-collapse: collapse; margin: 16px 0; }
  table.items th { background: #f0f0f0; border: 1px solid #ccc; padding: 5px 8px; text-align: left; font-size: 10px; }
  table.items td { border: 1px solid #ddd; padding: 4px 8px; }
  table.items tr:nth-child(even) td { background: #fafafa; }
  .totals { text-align: right; margin: 8px 0; }
  .total-row { font-size: 12px; margin: 2px 0; }
  .total-main { font-size: 14px; font-weight: bold; margin: 6px 0; }
  .in-words { font-size: 11px; color: #333; margin: 6px 0; font-style: italic; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-line { border-bottom: 1px solid #333; margin-top: 30px; font-size: 10px; }
  .footer-note { margin-top: 16px; font-size: 9px; color: #888; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="doc-title">СЧЁТ НА ОПЛАТУ № ${data.docNumber}</div>
    <div class="doc-sub">от ${data.docDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  ${data.org.bankBik ? `
  <div class="bank-box">
    <table>
      <tr><td>Банк:</td><td><strong>${data.org.bankName ?? ''}</strong></td></tr>
      <tr><td>БИК:</td><td>${data.org.bankBik}</td></tr>
      <tr><td>Р/с:</td><td>${data.org.bankAccount ?? ''}</td></tr>
      <tr><td>К/с:</td><td>${data.org.bankCorr ?? ''}</td></tr>
    </table>
  </div>` : ''}
</div>

<div class="parties">
  <div class="party-box">
    <div class="party-title">Поставщик (Исполнитель)</div>
    <div><strong>${data.org.name}</strong></div>
    <div>ИНН: ${data.org.inn}${data.org.kpp ? ` / КПП: ${data.org.kpp}` : ''}</div>
    <div>${data.org.address}</div>
    ${data.org.phone ? `<div>Тел: ${data.org.phone}</div>` : ''}
  </div>
  <div class="party-box">
    <div class="party-title">Покупатель (Заказчик)</div>
    <div><strong>${data.client.name}</strong></div>
    ${data.client.inn ? `<div>ИНН: ${data.client.inn}${data.client.kpp ? ` / КПП: ${data.client.kpp}` : ''}</div>` : ''}
    ${data.client.address ? `<div>${data.client.address}</div>` : ''}
    ${data.client.phone ? `<div>Тел: ${data.client.phone}</div>` : ''}
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th>№</th><th>Наименование</th><th>Ед.</th>
      <th>Кол-во</th><th>Цена, ₽</th><th>Сумма, ₽</th>
      ${vatCol}
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals">
  ${data.vatAmount !== undefined && data.vatAmount > 0
    ? `<div class="total-row">В т.ч. НДС: ${fmtMoney(data.vatAmount)} ₽</div>`
    : `<div class="total-row">НДС не облагается</div>`
  }
  <div class="total-main">ИТОГО: ${fmtMoney(data.totalAmount)} ₽</div>
  <div class="in-words">Итого ${data.items.length} позиций на сумму ${rubles(data.totalAmount)}</div>
</div>

${data.comment ? `<div style="margin:12px 0; font-size:11px;">Примечание: ${data.comment}</div>` : ''}

<div class="signatures">
  <div>
    <div>Руководитель ________________ ${data.org.director ?? ''}</div>
    <div class="sig-line">(подпись / расшифровка)</div>
  </div>
  <div>
    <div>Бухгалтер ________________</div>
    <div class="sig-line">(подпись / расшифровка)</div>
  </div>
</div>

<div class="footer-note">
  Данный счёт действителен 5 банковских дней. Оплата счёта означает согласие с условиями оказания услуг.
</div>

</body>
</html>`;
}

/** Акт выполненных работ */
export function generateActHtml(data: DocData): string {
  // Акт отличается от счёта — другой заголовок и блок подписей
  const invoice = generateInvoiceHtml(data);
  return invoice
    .replace('СЧЁТ НА ОПЛАТУ №', 'АКТ ВЫПОЛНЕННЫХ РАБОТ №')
    .replace('Поставщик (Исполнитель)', 'Исполнитель')
    .replace('Покупатель (Заказчик)', 'Заказчик')
    .replace('Руководитель', 'Исполнитель')
    .replace('Данный счёт действителен 5 банковских дней. Оплата счёта означает согласие с условиями оказания услуг.',
      'Работы/услуги выполнены в полном объёме, в установленные сроки. Стороны претензий не имеют.');
}
