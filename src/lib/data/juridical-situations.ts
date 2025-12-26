/**
 * Juridical Situation labels and color mappings
 * Labels extracted from KBO code.csv (JuridicalSituation category)
 */

import type { JuridicalSituation } from '@/lib/db/types';

export type SituationSeverity = 'normal' | 'info' | 'warning' | 'critical';

export interface JuridicalSituationInfo {
  fr: string;
  nl: string;
  severity: SituationSeverity;
}

export const JURIDICAL_SITUATIONS: Record<JuridicalSituation, JuridicalSituationInfo> = {
  normal: {
    fr: 'Situation normale',
    nl: 'Normale toestand',
    severity: 'normal',
  },
  legal_creation: {
    fr: 'Création juridique',
    nl: 'Juridische oprichting',
    severity: 'normal',
  },
  extension: {
    fr: 'Prorogation',
    nl: 'Verlenging',
    severity: 'info',
  },
  number_replacement: {
    fr: "Remplacement du numéro d'entreprise",
    nl: 'Vervanging van het ondernemingsnummer',
    severity: 'info',
  },
  stopped_number_replacement: {
    fr: "Arrêt pour remplacement du numéro d'entreprise",
    nl: 'Stopzetting wegens vervanging van het ondernemingsnummer',
    severity: 'info',
  },
  dissolution: {
    fr: 'Dissolution de plein droit',
    nl: 'Ontbinding van rechtswege',
    severity: 'critical',
  },
  foreign_ceased: {
    fr: 'Cessation des activités en Belgique',
    nl: 'Activiteitstopzetting in België',
    severity: 'warning',
  },
  opening_bankruptcy: {
    fr: 'Ouverture de faillite',
    nl: 'Opening faillissement',
    severity: 'critical',
  },
  closing_bankruptcy: {
    fr: 'Clôture de faillite',
    nl: 'Sluiting faillissement',
    severity: 'warning',
  },
  voluntary_dissolution: {
    fr: 'Dissolution volontaire - liquidation',
    nl: 'Vrijwillige ontbinding - vereffening',
    severity: 'warning',
  },
  judicial_dissolution: {
    fr: 'Dissolution judiciaire ou nullité',
    nl: 'Gerechtelijke ontbinding of nietigheid',
    severity: 'critical',
  },
  judicial_dissolution_closed: {
    fr: 'Clôture de liquidation',
    nl: 'Sluiting van vereffening',
    severity: 'warning',
  },
  annulment: {
    fr: 'Dossier annulé',
    nl: 'Geannuleerd dossier',
    severity: 'critical',
  },
  merger_acquisition: {
    fr: 'Fusion par absorption',
    nl: 'Fusie door overneming',
    severity: 'info',
  },
  division: {
    fr: 'Scission',
    nl: 'Splitsing',
    severity: 'info',
  },
  transfer_registered_office: {
    fr: "Transfert d'une entité enregistrée",
    nl: 'Overdracht geregistreerde entiteit',
    severity: 'info',
  },
  bankruptcy: {
    fr: 'Faillite',
    nl: 'Faillissement',
    severity: 'critical',
  },
  bankruptcy_closed: {
    fr: 'Faillite clôturée',
    nl: 'Faillissement gesloten',
    severity: 'warning',
  },
  liquidation: {
    fr: 'Liquidation',
    nl: 'Vereffening',
    severity: 'warning',
  },
  other: {
    fr: 'Autre situation',
    nl: 'Andere situatie',
    severity: 'info',
  },
};

const SEVERITY_COLORS: Record<SituationSeverity, string> = {
  normal: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function getJuridicalSituationLabel(
  situation: JuridicalSituation,
  lang: 'fr' | 'nl' | 'en'
): string {
  const info = JURIDICAL_SITUATIONS[situation];
  // Fallback to French for English
  return info?.[lang === 'en' ? 'fr' : lang] ?? situation;
}

export function getJuridicalSituationColor(situation: JuridicalSituation): string {
  const info = JURIDICAL_SITUATIONS[situation];
  return SEVERITY_COLORS[info?.severity ?? 'info'];
}

export function getJuridicalSituationSeverity(situation: JuridicalSituation): SituationSeverity {
  return JURIDICAL_SITUATIONS[situation]?.severity ?? 'info';
}
