/**
 * Belgian VAT Number Utilities
 *
 * Belgian VAT format: BE 0XXX.XXX.XXX or BE0XXXXXXXXX
 * - Starts with "BE" prefix (optional in input)
 * - 10 digits total
 * - First digit is 0 or 1
 * - Checksum: 97 - (first 8 digits mod 97) = last 2 digits
 */

const VAT_PATTERNS = {
  DIGITS_ONLY: /^[01]\d{9}$/,
  EXTRACT: /(?:BE\s?)?([01]\d{3})\.?(\d{3})\.?(\d{3})/i,
} as const;

export interface VatValidationResult {
  isValid: boolean;
  normalized: string | null;
  formatted: string | null;
  error?: string;
}

/**
 * Normalize a Belgian VAT number to 10 digits only.
 * Removes BE prefix, spaces, and dots.
 *
 * @example
 * normalizeVat("BE 0123.456.789") // "0123456789"
 * normalizeVat("BE0123456789")    // "0123456789"
 * normalizeVat("0123.456.789")    // "0123456789"
 */
export function normalizeVat(vat: string): string | null {
  if (!vat || typeof vat !== 'string') {
    return null;
  }

  const cleaned = vat
    .trim()
    .toUpperCase()
    .replace(/^BE\s?/, '')
    .replace(/[\s.]/g, '');

  if (!VAT_PATTERNS.DIGITS_ONLY.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Format a VAT number to Belgian display format: BE 0123.456.789
 *
 * @example
 * formatVat("0123456789")       // "BE 0123.456.789"
 * formatVat("BE 0123.456.789")  // "BE 0123.456.789"
 */
export function formatVat(vat: string): string | null {
  const normalized = normalizeVat(vat);
  if (!normalized) {
    return null;
  }

  return `BE ${normalized.slice(0, 4)}.${normalized.slice(4, 7)}.${normalized.slice(7, 10)}`;
}

/**
 * Validate a Belgian VAT number including checksum verification.
 *
 * Belgian VAT checksum algorithm:
 * 97 - (first 8 digits mod 97) = last 2 digits
 */
export function validateVat(vat: string): VatValidationResult {
  const normalized = normalizeVat(vat);

  if (!normalized) {
    return {
      isValid: false,
      normalized: null,
      formatted: null,
      error: 'Invalid VAT format. Expected format: BE 0123.456.789',
    };
  }

  const base = parseInt(normalized.slice(0, 8), 10);
  const checksum = parseInt(normalized.slice(8, 10), 10);
  const expectedChecksum = 97 - (base % 97);

  if (checksum !== expectedChecksum) {
    return {
      isValid: false,
      normalized,
      formatted: formatVat(normalized),
      error: `Invalid VAT checksum. Expected ${expectedChecksum.toString().padStart(2, '0')}, got ${checksum.toString().padStart(2, '0')}`,
    };
  }

  return {
    isValid: true,
    normalized,
    formatted: formatVat(normalized)!,
  };
}

/**
 * Check if a string contains a valid Belgian VAT number.
 */
export function isValidVat(vat: string): boolean {
  return validateVat(vat).isValid;
}

/**
 * Extract VAT number from a larger string (e.g., invoice text).
 */
export function extractVat(text: string): string | null {
  const match = text.match(VAT_PATTERNS.EXTRACT);
  if (!match) {
    return null;
  }

  const digits = match[1] + match[2] + match[3];
  const result = validateVat(digits);
  return result.isValid ? result.normalized : null;
}
