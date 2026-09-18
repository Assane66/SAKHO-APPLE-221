export function splitPhoneNumbers(value?: string): string[] {
  return (value || '')
    .split('/')
    .map(phone => phone.trim())
    .filter(Boolean);
}

export function normalizePhoneNumber(value?: string): string {
  return (value || '').replace(/\D/g, '');
}
