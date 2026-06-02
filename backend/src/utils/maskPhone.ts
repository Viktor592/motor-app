export function maskPhone(phone: string): string {
  // +79001234567 → +7 (9**) ***-**-67
  const d = phone.replace(/\D/g, '');
  if (d.length < 11) return phone;
  return `+7 (${d[1]}**) ***-**-${d[9]}${d[10]}`;
}
