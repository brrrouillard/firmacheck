/**
 * Slugify Utility for Belgian Company Names
 *
 * Handles:
 * - French accented characters (é, è, ê, ë, à, â, ù, û, ô, î, ï, ç, œ, æ)
 * - Dutch special characters (similar + ij digraph)
 * - Company-specific edge cases (apostrophes, &, numbers)
 */

const CHAR_MAP: Record<string, string> = {
  // French vowels with accents
  à: 'a',
  â: 'a',
  ä: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  î: 'i',
  ï: 'i',
  ô: 'o',
  ö: 'o',
  ù: 'u',
  û: 'u',
  ü: 'u',
  ÿ: 'y',

  // French special characters
  ç: 'c',
  œ: 'oe',
  æ: 'ae',

  // Dutch digraph
  ĳ: 'ij',

  // German
  ß: 'ss',

  // Common symbols
  '&': 'and',
  '@': 'at',

  // Uppercase variants
  À: 'a',
  Â: 'a',
  Ä: 'a',
  É: 'e',
  È: 'e',
  Ê: 'e',
  Ë: 'e',
  Î: 'i',
  Ï: 'i',
  Ô: 'o',
  Ö: 'o',
  Ù: 'u',
  Û: 'u',
  Ü: 'u',
  Ÿ: 'y',
  Ç: 'c',
  Œ: 'oe',
  Æ: 'ae',
  Ĳ: 'ij',
};

export interface SlugifyOptions {
  /** Maximum length of the slug (default: 100) */
  maxLength?: number;
  /** Separator character (default: '-') */
  separator?: string;
  /** Preserve case (default: false - lowercase) */
  preserveCase?: boolean;
  /** Custom character map to extend defaults */
  customMap?: Record<string, string>;
}

/**
 * Convert a string to a URL-safe slug.
 *
 * @example
 * slugify("Boulangerie André & Fils")     // "boulangerie-andre-and-fils"
 * slugify("Société d'Électricité")        // "societe-d-electricite"
 * slugify("Van IJzendoorn NV")            // "van-ijzendoorn-nv"
 * slugify("Café-Restaurant L'Étoile")     // "cafe-restaurant-l-etoile"
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
  const {
    maxLength = 100,
    separator = '-',
    preserveCase = false,
    customMap = {},
  } = options;

  if (!input || typeof input !== 'string') {
    return '';
  }

  const charMap = { ...CHAR_MAP, ...customMap };

  let result = input.trim();

  // Replace mapped characters
  result = result
    .split('')
    .map((char) => charMap[char] ?? char)
    .join('');

  // Handle Dutch "IJ" digraph
  result = result.replace(/IJ/g, 'ij').replace(/Ij/g, 'ij');

  if (!preserveCase) {
    result = result.toLowerCase();
  }

  // Replace apostrophes with separator
  result = result.replace(/[''`´]/g, separator);

  // Replace non-alphanumeric with separator
  result = result.replace(/[^a-zA-Z0-9]+/g, separator);

  // Remove leading/trailing separators
  const sepRegex = new RegExp(
    `^${escapeRegex(separator)}+|${escapeRegex(separator)}+$`,
    'g'
  );
  result = result.replace(sepRegex, '');

  // Collapse multiple separators
  result = result.replace(new RegExp(`${escapeRegex(separator)}+`, 'g'), separator);

  // Truncate to max length
  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
    const lastSep = result.lastIndexOf(separator);
    if (lastSep > maxLength * 0.7) {
      result = result.slice(0, lastSep);
    }
  }

  return result;
}

/**
 * Generate a slug from company name with Belgian-specific handling.
 *
 * Optionally removes common Belgian company suffixes:
 * NV, BV, BVBA, SA, SPRL, SRL, etc.
 */
export function slugifyCompanyName(
  name: string,
  options: SlugifyOptions & { removeSuffix?: boolean } = {}
): string {
  const { removeSuffix = false, ...slugifyOptions } = options;

  let processedName = name;

  if (removeSuffix) {
    const suffixPattern =
      /\s*\b(NV|BV|BVBA|CVBA|VOF|SA|SPRL|SRL|SC|SCS|SNC|SCRL|GCV|COMM\.?V\.?|ASBL|VZW|IVZW)\b\.?\s*$/i;
    processedName = processedName.replace(suffixPattern, '');
  }

  return slugify(processedName, slugifyOptions);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
