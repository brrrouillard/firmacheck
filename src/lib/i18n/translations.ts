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
      capital: 'Capital',
      fiscalYearEnd: 'Clôture',
      annualMeeting: 'AG en',
    },
    activity: {
      mainActivity: 'Activité principale',
      legalForm: 'Forme juridique',
      otherActivities: 'autres activités',
      noActivity: 'Activité non renseignée',
      showHistory: 'Voir l\'historique des activités',
    },
    qualifications: {
      vatSubject: 'Assujetti TVA',
      employer: 'Employeur',
    },
    entityLinks: {
      title: 'Structure',
      partOf: 'Fait partie de',
      owns: 'Possède',
      predecessor: 'Prédécesseur',
      successor: 'Successeur',
      related: 'Entité liée',
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
    faq: {
      title: 'Questions fréquemment posées',
      vatQuestion: 'Quel est le numéro de TVA de {company} ?',
      vatAnswer: 'Le numéro de TVA de cette entreprise est {vat}.',
      creationQuestion: 'Quand {company} a-t-elle été créée ?',
      creationAnswer: '{company} a été créée le {date}.',
      addressQuestion: 'Quelle est l\'adresse de {company} ?',
      addressAnswer: 'Le siège social de {company} est situé au {address}.',
      employeesQuestion: 'Combien d\'employés compte {company} ?',
      employeesAnswer: 'Selon les dernières données disponibles, {company} emploie {count} personnes.',
      turnoverQuestion: 'Quel est le chiffre d\'affaires de {company} ?',
      turnoverAnswer: 'Le chiffre d\'affaires de {company} était de {amount} en {year}.',
    },
    functions: {
      title: 'Direction',
      since: 'depuis le',
      director: 'Administrateur',
      manager: 'Gérant',
      ceo: 'Administrateur délégué',
      president: 'Président',
      secretary: 'Secrétaire',
      other: 'Fonction',
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
      capital: 'Kapitaal',
      fiscalYearEnd: 'Afsluiting',
      annualMeeting: 'AV in',
    },
    activity: {
      mainActivity: 'Hoofdactiviteit',
      legalForm: 'Rechtsvorm',
      otherActivities: 'andere activiteiten',
      noActivity: 'Activiteit niet vermeld',
      showHistory: 'Toon activiteitengeschiedenis',
    },
    qualifications: {
      vatSubject: 'BTW-plichtig',
      employer: 'Werkgever',
    },
    entityLinks: {
      title: 'Structuur',
      partOf: 'Onderdeel van',
      owns: 'Bezit',
      predecessor: 'Voorganger',
      successor: 'Opvolger',
      related: 'Verbonden entiteit',
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
    faq: {
      title: 'Veelgestelde vragen',
      vatQuestion: 'Wat is het BTW-nummer van {company}?',
      vatAnswer: 'Het BTW-nummer van dit bedrijf is {vat}.',
      creationQuestion: 'Wanneer is {company} opgericht?',
      creationAnswer: '{company} is opgericht op {date}.',
      addressQuestion: 'Wat is het adres van {company}?',
      addressAnswer: 'De maatschappelijke zetel van {company} is gevestigd op {address}.',
      employeesQuestion: 'Hoeveel werknemers heeft {company}?',
      employeesAnswer: 'Volgens de laatst beschikbare gegevens heeft {company} {count} werknemers.',
      turnoverQuestion: 'Wat is de omzet van {company}?',
      turnoverAnswer: 'De omzet van {company} bedroeg {amount} in {year}.',
    },
    functions: {
      title: 'Bestuur',
      since: 'sinds',
      director: 'Bestuurder',
      manager: 'Zaakvoerder',
      ceo: 'Gedelegeerd bestuurder',
      president: 'Voorzitter',
      secretary: 'Secretaris',
      other: 'Functie',
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
      capital: 'Share Capital',
      fiscalYearEnd: 'Year end',
      annualMeeting: 'AGM in',
    },
    activity: {
      mainActivity: 'Main Activity',
      legalForm: 'Legal Form',
      otherActivities: 'other activities',
      noActivity: 'Activity not specified',
      showHistory: 'Show activity history',
    },
    qualifications: {
      vatSubject: 'VAT Registered',
      employer: 'Employer',
    },
    entityLinks: {
      title: 'Structure',
      partOf: 'Part of',
      owns: 'Owns',
      predecessor: 'Predecessor',
      successor: 'Successor',
      related: 'Related entity',
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
    faq: {
      title: 'Frequently Asked Questions',
      vatQuestion: 'What is the VAT number of {company}?',
      vatAnswer: 'The VAT number of this company is {vat}.',
      creationQuestion: 'When was {company} founded?',
      creationAnswer: '{company} was founded on {date}.',
      addressQuestion: 'What is the address of {company}?',
      addressAnswer: 'The registered office of {company} is located at {address}.',
      employeesQuestion: 'How many employees does {company} have?',
      employeesAnswer: 'According to the latest available data, {company} employs {count} people.',
      turnoverQuestion: 'What is the turnover of {company}?',
      turnoverAnswer: 'The turnover of {company} was {amount} in {year}.',
    },
    functions: {
      title: 'Management',
      since: 'since',
      director: 'Director',
      manager: 'Manager',
      ceo: 'CEO',
      president: 'President',
      secretary: 'Secretary',
      other: 'Function',
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
