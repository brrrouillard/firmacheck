/**
 * UI translations for company page
 */

export type SupportedLang = 'fr' | 'nl' | 'en';

const translations: Record<SupportedLang, Record<string, Record<string, string>>> = {
  fr: {
    header: {
      searchPlaceholder: 'Rechercher une entreprise...',
    },
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
      foundedIn: 'Fondée le',
      yearsOld: 'ans',
      contact: 'Contact',
      noAddress: 'Adresse non disponible',
      box: 'bte',
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
      detailedFinancials: 'Données financières détaillées',
    },
    footer: {
      dataLabel: 'Données :',
      updatedDaysAgo: 'il y a',
      days: 'jours',
      today: 'aujourd\'hui',
      yesterday: 'hier',
      viewOnKbo: 'Voir sur KBO-BCE',
      viewOnNbb: 'Voir sur BNB',
    },
    related: {
      similarIn: 'Entreprises similaires en',
      neighborsIn: 'Entreprises à',
      thisSector: 'ce secteur',
    },
  },
  nl: {
    header: {
      searchPlaceholder: 'Zoek een bedrijf...',
    },
    hero: {
      trackCompany: 'Volgen',
      downloadReport: 'PDF Rapport',
      comingSoon: 'Binnenkort beschikbaar',
    },
    snapshot: {
      identity: 'Identiteit',
      activity: 'Activiteit',
      financialPulse: 'Financiële gezondheid',
    },
    identity: {
      address: 'Adres',
      showOnMap: 'Bekijk op Google Maps',
      foundedIn: 'Opgericht op',
      yearsOld: 'jaar',
      contact: 'Contact',
      noAddress: 'Adres niet beschikbaar',
      box: 'bus',
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
      detailedFinancials: 'Gedetailleerde financiële gegevens',
    },
    footer: {
      dataLabel: 'Gegevens:',
      updatedDaysAgo: '',
      days: 'dagen geleden',
      today: 'vandaag',
      yesterday: 'gisteren',
      viewOnKbo: 'Bekijk op KBO-BCE',
      viewOnNbb: 'Bekijk op NBB',
    },
    related: {
      similarIn: 'Vergelijkbare bedrijven in',
      neighborsIn: 'Bedrijven in',
      thisSector: 'deze sector',
    },
  },
  en: {
    header: {
      searchPlaceholder: 'Search companies...',
    },
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
      foundedIn: 'Founded on',
      yearsOld: 'years',
      contact: 'Contact',
      noAddress: 'Address not available',
      box: 'box',
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
      detailedFinancials: 'Detailed Financial Data',
    },
    footer: {
      dataLabel: 'Data:',
      updatedDaysAgo: '',
      days: 'days ago',
      today: 'today',
      yesterday: 'yesterday',
      viewOnKbo: 'View on KBO-BCE',
      viewOnNbb: 'View on NBB',
    },
    related: {
      similarIn: 'Similar companies in',
      neighborsIn: 'Companies in',
      thisSector: 'this sector',
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
 * Format days ago with appropriate text (includes "Data:" label)
 */
export function formatDaysAgo(days: number, lang: SupportedLang): string {
  const label = t(lang, 'footer', 'dataLabel');

  if (days === 0) return `${label} ${t(lang, 'footer', 'today')}`;
  if (days === 1) return `${label} ${t(lang, 'footer', 'yesterday')}`;

  const prefix = t(lang, 'footer', 'updatedDaysAgo');
  const suffix = t(lang, 'footer', 'days');

  // Different word order for different languages
  if (lang === 'fr') {
    return `${label} ${prefix} ${days} ${suffix}`;
  }
  return `${label} ${days} ${suffix}`;
}
