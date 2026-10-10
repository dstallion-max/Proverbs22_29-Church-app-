
export function toE164(input) {
  if (!input) return null;

  let cleaned = String(input).trim();
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/\D/g, '');

  if (!cleaned) return null;

  // Already has 234 country code
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return '+' + cleaned;
  }

  // Nigerian local format: 0XXXXXXXXXX (11 digits)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+234' + cleaned.slice(1);
  }

  // Just 10 digits without leading 0
  if (cleaned.length === 10) {
    return '+234' + cleaned;
  }

  // Has + and enough digits — trust the user
  if (hasPlus && cleaned.length >= 10) {
    return '+' + cleaned;
  }

  return null;
}


export function formatForDisplay(e164) {
  if (!e164 || !e164.startsWith('+234')) return e164 || '';
  const digits = e164.slice(4);
  return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}