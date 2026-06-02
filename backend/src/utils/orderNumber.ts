export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts   = Date.now().toString().slice(-4);
  return `ЗН-${year}-${ts}${rand}`.slice(0, 14);
}
