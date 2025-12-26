/**
 * UI translations for company page
 */

export type SupportedLang = 'fr' | 'nl' | 'en';

const translations: Record<SupportedLang, Record<string, Record<string, string>>> = {
  fr: {
    hero: {
      trackCompany: 'Suivre',
      downloadReport: 'Rapport PDF',
      comingSoon: 'Bientôt disponible',
    },
    snapshot: {
      identity: 'Identité',
      activity: 'Activité',
      financialPulse: 'Santé financière',
    },
    identity: {
      address: 'Adresse',
      showOnMap: 'Voir sur Google Maps',
      foundedIn: 'Fondée en',
      yearsOld: 'ans',
      contact: 'Contact',
      noAddress: 'Adresse non disponible',
    },
    activity: {
      mainActivity: 'Activité principale',
      legalForm: 'Forme juridique',
      otherActivities: 'autres activités',
      noActivity: 'Activité non renseignée',
    },
    financials: {
      turnover: 'Chiffre d\'affaires',
      netProfit: 'Résultat net',
      employees: 'Employés',
      noData: 'Comptabilité simplifiée',
      noDataDescription: 'Pas de données détaillées disponibles',
      grossMargin: 'Marge brute',
      netMargin: 'Marge nette',
      equity: 'Fonds propres',
    },
    footer: {
      updatedDaysAgo: 'Mis à jour il y a',
      days: 'jours',
      today: 'aujourd\'hui',
      yesterday: 'hier',
      viewOnKbo: 'Voir sur KBO-BCE',
      viewOnNbb: 'Voir sur BNB',
    },
  },
  nl: {
    hero: {
      trackCompany: 'Volgen',
      downloadReport: 'PDF Rapport',
      comingSoon: 'Binnenkort beschikbaar',
    },
    snapshot: {
      identity: 'Identiteit',
      activity: 'Activiteit',
      financialPulse: 'Financiele gezondheid',
    },
    identity: {
      address: 'Adres',
      showOnMap: 'Bekijk op Google Maps',
      foundedIn: 'Opgericht in',
      yearsOld: 'jaar',
      contact: 'Contact',
      noAddress: 'Adres niet beschikbaar',
    },
    activity: {
      mainActivity: 'Hoofdactiviteit',
      legalForm: 'Rechtsvorm',
      otherActivities: 'andere activiteiten',
      noActivity: 'Activiteit niet vermeld',
    },
    financials: {
      turnover: 'Omzet',
      netProfit: 'Nettoresultaat',
      employees: 'Werknemers',
      noData: 'Vereenvoudigde boekhouding',
      noDataDescription: 'Geen gedetailleerde gegevens beschikbaar',
      grossMargin: 'Bruto marge',
      netMargin: 'Netto marge',
      equity: 'Eigen vermogen',
    },
    footer: {
      updatedDaysAgo: 'Bijgewerkt',
      days: 'dagen geleden',
      today: 'vandaag',
      yesterday: 'gisteren',
      viewOnKbo: 'Bekijk op KBO-BCE',
      viewOnNbb: 'Bekijk op NBB',
    },
  },
  en: {
    hero: {
      trackCompany: 'Track',
      downloadReport: 'PDF Report',
      comingSoon: 'Coming soon',
    },
    snapshot: {
      identity: 'Identity',
      activity: 'Activity',
      financialPulse: 'Financial Health',
    },
    identity: {
      address: 'Address',
      showOnMap: 'View on Google Maps',
      foundedIn: 'Founded in',
      yearsOld: 'years',
      contact: 'Contact',
      noAddress: 'Address not available',
    },
    activity: {
      mainActivity: 'Main Activity',
      legalForm: 'Legal Form',
      otherActivities: 'other activities',
      noActivity: 'Activity not specified',
    },
    financials: {
      turnover: 'Turnover',
      netProfit: 'Net Profit',
      employees: 'Employees',
      noData: 'Simplified Accounting',
      noDataDescription: 'No detailed data available',
      grossMargin: 'Gross Margin',
      netMargin: 'Net Margin',
      equity: 'Equity',
    },
    footer: {
      updatedDaysAgo: 'Updated',
      days: 'days ago',
      today: 'today',
      yesterday: 'yesterday',
      viewOnKbo: 'View on KBO-BCE',
      viewOnNbb: 'View on NBB',
    },
  },
};

/**
 * Get translation for a given key
 * @param lang - Language code
 * @param section - Section of translations (e.g., 'hero', 'snapshot')
 * @param key - Specific translation key
 */
export function t(lang: SupportedLang, section: string, key: string): string {
  return translations[lang]?.[section]?.[key] ?? translations.en[section]?.[key] ?? key;
}

/**
 * Format days ago with appropriate text
 */
export function formatDaysAgo(days: number, lang: SupportedLang): string {
  if (days === 0) return t(lang, 'footer', 'today');
  if (days === 1) return t(lang, 'footer', 'yesterday');

  const prefix = t(lang, 'footer', 'updatedDaysAgo');
  const suffix = t(lang, 'footer', 'days');

  // Different word order for different languages
  if (lang === 'nl') {
    return `${prefix} ${days} ${suffix}`;
  }
  return `${prefix} ${days} ${suffix}`;
}
