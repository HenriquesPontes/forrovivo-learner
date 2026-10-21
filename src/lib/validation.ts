export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const GUEST_MAX_UNIT = 1;

export function validateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[\u0000-\u001f\u007f]/.test(email) ? email : null;
}

export function validatePassword(raw: string): string | null {
  return raw.length >= MIN_PASSWORD_LENGTH && raw.length <= MAX_PASSWORD_LENGTH && !/[\u0000-\u001f\u007f]/.test(raw) ? raw : null;
}
