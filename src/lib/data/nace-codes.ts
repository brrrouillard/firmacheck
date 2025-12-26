/**
 * NACE 2008 code descriptions
 * Extracted from KBO code.csv - most common 5-digit codes
 */

export interface NaceDescription {
  fr: string;
  nl: string;
}

/**
 * Common NACE 2008 codes with FR/NL descriptions
 * Falls back to null for unknown codes
 */
export const NACE_CODES: Record<string, NaceDescription> = {
  // IT & Technology (62xxx)
  '62010': { fr: 'Programmation informatique', nl: 'Ontwerpen en programmeren van computerprogramma\'s' },
  '62020': { fr: 'Conseil informatique', nl: 'Computerconsultancy-activiteiten' },
  '62030': { fr: 'Gestion d\'installations informatiques', nl: 'Beheer van computerfaciliteiten' },
  '62090': { fr: 'Autres activités informatiques', nl: 'Overige diensten op het gebied van informatietechnologie' },

  // Data & Internet (63xxx)
  '63110': { fr: 'Traitement de données et hébergement', nl: 'Gegevensverwerking, webhosting en aanverwante activiteiten' },
  '63120': { fr: 'Portails Internet', nl: 'Webportalen' },
  '63910': { fr: 'Activités des agences de presse', nl: 'Persagentschappen' },
  '63990': { fr: 'Autres services d\'information', nl: 'Overige dienstverlenende activiteiten op het gebied van informatie' },

  // Legal & Accounting (69xxx)
  '69101': { fr: 'Activités des avocats', nl: 'Activiteiten van advocaten' },
  '69102': { fr: 'Activités des notaires', nl: 'Activiteiten van notarissen' },
  '69103': { fr: 'Activités des huissiers de justice', nl: 'Activiteiten van deurwaarders' },
  '69109': { fr: 'Autres activités juridiques', nl: 'Overige rechtskundige dienstverlening' },
  '69201': { fr: 'Experts-comptables et conseils fiscaux', nl: 'Accountants en belastingconsulenten' },
  '69202': { fr: 'Comptables et comptables-fiscalistes', nl: 'Boekhouders en boekhouders-fiscalisten' },
  '69203': { fr: 'Réviseurs d\'entreprises', nl: 'Bedrijfsrevisoren' },

  // Management & Consulting (70xxx)
  '70100': { fr: 'Activités des sièges sociaux', nl: 'Activiteiten van hoofdkantoren' },
  '70210': { fr: 'Conseil en relations publiques et communication', nl: 'Adviesbureaus op het gebied van public relations en communicatie' },
  '70220': { fr: 'Conseil pour les affaires et gestion', nl: 'Overige adviesbureaus op het gebied van bedrijfsbeheer' },

  // Architecture & Engineering (71xxx)
  '71111': { fr: 'Architecture de construction', nl: 'Bouwarchitecten' },
  '71112': { fr: 'Architecture d\'intérieur', nl: 'Interieurarchitecten' },
  '71113': { fr: 'Urbanisme et paysage', nl: 'Stedebouwkundige en tuin- en landschapsarchitecten' },
  '71121': { fr: 'Ingénierie et conseils techniques', nl: 'Ingenieurs en aanverwante technische adviseurs' },
  '71122': { fr: 'Activités des géomètres', nl: 'Landmeters' },
  '71201': { fr: 'Contrôle technique des véhicules', nl: 'Technische controle van motorvoertuigen' },
  '71209': { fr: 'Autres contrôles et analyses techniques', nl: 'Overige technische testen en toetsen' },

  // Research & Development (72xxx)
  '72110': { fr: 'R&D en biotechnologie', nl: 'Speur- en ontwikkelingswerk op biotechnologisch gebied' },
  '72190': { fr: 'R&D en sciences physiques et naturelles', nl: 'Overig speur- en ontwikkelingswerk op natuurwetenschappelijk gebied' },
  '72200': { fr: 'R&D en sciences humaines et sociales', nl: 'Speur- en ontwikkelingswerk op het gebied van maatschappij- en geesteswetenschappen' },

  // Advertising & Design (73xxx, 74xxx)
  '73110': { fr: 'Agences de publicité', nl: 'Reclamebureaus' },
  '73120': { fr: 'Régie publicitaire de médias', nl: 'Mediarepresentatie' },
  '73200': { fr: 'Études de marché et sondages', nl: 'Markt- en opinieonderzoekbureaus' },
  '74101': { fr: 'Création de modèles', nl: 'Ontwerpen van textielpatronen, kleding, juwelen, meubels' },
  '74102': { fr: 'Design industriel', nl: 'Activiteiten van industriele designers' },
  '74103': { fr: 'Design graphique', nl: 'Activiteiten van grafische designers' },
  '74104': { fr: 'Décoration d\'intérieur', nl: 'Activiteiten van interieurdecorateurs' },
  '74201': { fr: 'Production photographique', nl: 'Activiteiten van fotografen' },
  '74300': { fr: 'Traduction et interprétation', nl: 'Vertalers en tolken' },
  '74909': { fr: 'Autres activités spécialisées', nl: 'Overige gespecialiseerde wetenschappelijke en technische activiteiten' },

  // Construction (41xxx, 43xxx)
  '41101': { fr: 'Promotion immobilière résidentielle', nl: 'Ontwikkeling van residentiele bouwprojecten' },
  '41102': { fr: 'Promotion immobilière non résidentielle', nl: 'Ontwikkeling van niet-residentiele bouwprojecten' },
  '41201': { fr: 'Construction de bâtiments résidentiels', nl: 'Algemene bouw van residentiele gebouwen' },
  '41202': { fr: 'Construction d\'immeubles de bureaux', nl: 'Algemene bouw van kantoorgebouwen' },
  '41203': { fr: 'Construction d\'autres bâtiments non résidentiels', nl: 'Algemene bouw van andere niet-residentiele gebouwen' },
  '43110': { fr: 'Travaux de démolition', nl: 'Slopen' },
  '43120': { fr: 'Préparation des sites', nl: 'Bouwrijp maken van terreinen' },
  '43211': { fr: 'Installation électrotechnique de bâtiment', nl: 'Elektrotechnische installatiewerken aan gebouwen' },
  '43221': { fr: 'Travaux de plomberie', nl: 'Loodgieterswerk' },
  '43222': { fr: 'Chauffage, ventilation et climatisation', nl: 'Installatie van verwarming, klimaatregeling en ventilatie' },
  '43310': { fr: 'Travaux de plâtrerie', nl: 'Stukadoorswerk' },
  '43320': { fr: 'Travaux de menuiserie', nl: 'Schrijnwerk' },
  '43331': { fr: 'Pose de carrelages', nl: 'Plaatsen van vloer- en wandtegels' },
  '43341': { fr: 'Peinture de bâtiments', nl: 'Schilderen van gebouwen' },
  '43910': { fr: 'Travaux de couverture', nl: 'Dakwerkzaamheden' },
  '43999': { fr: 'Autres activités de construction spécialisées', nl: 'Overige gespecialiseerde bouwwerkzaamheden' },

  // Wholesale (46xxx)
  '46190': { fr: 'Commerce de gros en produits divers', nl: 'Handelsbemiddeling in goederen, algemeen assortiment' },
  '46510': { fr: 'Commerce de gros d\'ordinateurs et logiciels', nl: 'Groothandel in computers, randapparatuur en software' },
  '46520': { fr: 'Commerce de gros d\'équipements électroniques', nl: 'Groothandel in elektronische en telecommunicatieapparatuur' },
  '46690': { fr: 'Commerce de gros d\'autres machines', nl: 'Groothandel in andere machines en werktuigen' },
  '46900': { fr: 'Commerce de gros non spécialisé', nl: 'Niet-gespecialiseerde groothandel' },

  // Retail (47xxx)
  '47111': { fr: 'Commerce de détail de produits surgelés', nl: 'Detailhandel in diepvriesproducten' },
  '47191': { fr: 'Commerce de détail non spécialisé', nl: 'Detailhandel in niet-gespecialiseerde winkels' },
  '47410': { fr: 'Commerce de détail d\'ordinateurs et logiciels', nl: 'Detailhandel in computers, randapparatuur en software' },
  '47420': { fr: 'Commerce de détail de télécommunications', nl: 'Detailhandel in telecommunicatieapparatuur' },
  '47521': { fr: 'Commerce de détail de matériaux de construction', nl: 'Bouwmarkten en doe-het-zelfzaken' },
  '47591': { fr: 'Commerce de détail de meubles', nl: 'Detailhandel in meubelen' },
  '47710': { fr: 'Commerce de détail de vêtements', nl: 'Detailhandel in kleding' },
  '47910': { fr: 'Vente à distance', nl: 'Detailhandel via postorder of via internet' },
  '47990': { fr: 'Autres commerces de détail hors magasin', nl: 'Overige detailhandel, niet in winkels' },

  // Food & Hospitality (55xxx, 56xxx)
  '55100': { fr: 'Hôtels et hébergement similaire', nl: 'Hotels en dergelijke accommodatie' },
  '55201': { fr: 'Centres et villages de vacances', nl: 'Vakantiecentra en -dorpen' },
  '55300': { fr: 'Terrains de camping', nl: 'Kampeerterreinen' },
  '56101': { fr: 'Restauration à service complet', nl: 'Eetgelegenheden met volledige bediening' },
  '56102': { fr: 'Restauration à service restreint', nl: 'Eetgelegenheden met beperkte bediening' },
  '56210': { fr: 'Services de traiteurs', nl: 'Catering' },
  '56301': { fr: 'Cafés et bars', nl: 'Cafes en bars' },
  '56302': { fr: 'Discothèques et dancings', nl: 'Discotheken, dancings' },

  // Transport (49xxx)
  '49100': { fr: 'Transport ferroviaire de voyageurs', nl: 'Personenvervoer per spoor' },
  '49310': { fr: 'Transports urbains de voyageurs', nl: 'Stads- en voorstadsvervoer van passagiers' },
  '49320': { fr: 'Transports de voyageurs par taxi', nl: 'Taxivervoer' },
  '49390': { fr: 'Autres transports terrestres de voyageurs', nl: 'Overig personenvervoer te land' },
  '49410': { fr: 'Transports routiers de fret', nl: 'Goederenvervoer over de weg' },

  // Real Estate (68xxx)
  '68100': { fr: 'Activités des marchands de biens immobiliers', nl: 'Handel in eigen onroerend goed' },
  '68201': { fr: 'Location de logements', nl: 'Verhuur van woningen' },
  '68202': { fr: 'Location de terrains', nl: 'Verhuur van gronden' },
  '68203': { fr: 'Location d\'autres biens immobiliers', nl: 'Verhuur van ander eigen onroerend goed' },
  '68311': { fr: 'Agences immobilières', nl: 'Bemiddeling bij de aankoop, verkoop en verhuur van onroerend goed' },
  '68321': { fr: 'Administration d\'immeubles résidentiels', nl: 'Beheer van residentiele gebouwen' },
  '68322': { fr: 'Administration d\'autres biens immobiliers', nl: 'Beheer van niet-residentiele gebouwen' },

  // Healthcare (86xxx)
  '86101': { fr: 'Activités hospitalières générales', nl: 'Algemene ziekenhuizen' },
  '86102': { fr: 'Activités hospitalières spécialisées', nl: 'Gespecialiseerde ziekenhuizen' },
  '86210': { fr: 'Activités des médecins généralistes', nl: 'Huisartspraktijken' },
  '86220': { fr: 'Activités des médecins spécialistes', nl: 'Praktijken van specialisten' },
  '86230': { fr: 'Pratique dentaire', nl: 'Tandartspraktijken' },
  '86901': { fr: 'Activités des laboratoires médicaux', nl: 'Activiteiten van medische laboratoria' },
  '86903': { fr: 'Activités de transport par ambulance', nl: 'Ziekenvervoer' },
  '86904': { fr: 'Activités relatives à la santé mentale', nl: 'Activiteiten van psychologen en psychotherapeuten' },
  '86905': { fr: 'Activités de kinésithérapie', nl: 'Praktijken van fysiotherapeuten' },
  '86906': { fr: 'Activités des infirmiers', nl: 'Verpleegkundige activiteiten' },
  '86909': { fr: 'Autres activités pour la santé humaine', nl: 'Overige menselijke gezondheidszorg' },

  // Education (85xxx)
  '85201': { fr: 'Enseignement primaire ordinaire', nl: 'Gewoon basisonderwijs' },
  '85310': { fr: 'Enseignement secondaire général', nl: 'Algemeen secundair onderwijs' },
  '85410': { fr: 'Enseignement post-secondaire non supérieur', nl: 'Niet-universitair post-secundair onderwijs' },
  '85421': { fr: 'Enseignement supérieur universitaire', nl: 'Universitair hoger onderwijs' },
  '85510': { fr: 'Enseignement de disciplines sportives', nl: 'Sport- en recreatieonderwijs' },
  '85520': { fr: 'Enseignement culturel', nl: 'Cultureel onderwijs' },
  '85531': { fr: 'Auto-écoles', nl: 'Rijscholen' },
  '85592': { fr: 'Formation professionnelle', nl: 'Beroepsopleiding' },
  '85593': { fr: 'Formation des adultes', nl: 'Volwassenenonderwijs' },
  '85599': { fr: 'Autres formes d\'enseignement', nl: 'Overige vormen van onderwijs' },

  // Manufacturing (10xxx-33xxx)
  '10110': { fr: 'Transformation et conservation de viande de boucherie', nl: 'Verwerking en conservering van vlees' },
  '10710': { fr: 'Fabrication de pain et de pâtisserie fraîche', nl: 'Vervaardiging van brood en vers banketbakkerswerk' },
  '25110': { fr: 'Fabrication de structures métalliques', nl: 'Vervaardiging van metalen constructiewerken' },
  '25620': { fr: 'Usinage', nl: 'Verspaning' },

  // Personal Services (96xxx)
  '96011': { fr: 'Blanchisseries', nl: 'Wasserijen' },
  '96021': { fr: 'Coiffure', nl: 'Kappers' },
  '96022': { fr: 'Soins de beauté', nl: 'Schoonheidsverzorging' },
  '96040': { fr: 'Entretien corporel', nl: 'Sauna\'s, solaria, massagesalons e.d.' },
  '96091': { fr: 'Services d\'animaux de compagnie', nl: 'Diensten in verband met huisdieren' },
  '96099': { fr: 'Autres services personnels', nl: 'Overige persoonlijke diensten' },

  // Arts & Entertainment (90xxx, 93xxx)
  '90011': { fr: 'Production de spectacles par des artistes indépendants', nl: 'Beoefening van podiumkunst door zelfstandig werkende artiesten' },
  '90021': { fr: 'Promotion et organisation de spectacles', nl: 'Promotie en organisatie van podiumkunstactiviteiten' },
  '90031': { fr: 'Création artistique', nl: 'Scheppende kunsten' },
  '93110': { fr: 'Gestion d\'installations sportives', nl: 'Exploitatie van sportaccommodaties' },
  '93120': { fr: 'Activités de clubs de sports', nl: 'Activiteiten van sportclubs' },
  '93130': { fr: 'Activités des centres de fitness', nl: 'Fitnesscentra' },
  '93199': { fr: 'Autres activités sportives', nl: 'Overige sportactiviteiten' },
  '93211': { fr: 'Activités foraines', nl: 'Exploitatie van kermisattracties' },
  '93291': { fr: 'Exploitation de salles de jeux', nl: 'Exploitatie van snooker- en biljartruimtes' },
  '93299': { fr: 'Autres activités récréatives', nl: 'Overige recreatieactiviteiten' },

  // Associations (94xxx)
  '94110': { fr: 'Organisations patronales et consulaires', nl: 'Bedrijfs-, werkgevers- en beroepsorganisaties' },
  '94120': { fr: 'Organisations professionnelles', nl: 'Beroepsorganisaties' },
  '94200': { fr: 'Syndicats de salariés', nl: 'Vakbonden' },
  '94910': { fr: 'Organisations religieuses', nl: 'Religieuze organisaties' },
  '94920': { fr: 'Organisations politiques', nl: 'Politieke organisaties' },
  '94990': { fr: 'Autres organisations associatives', nl: 'Overige organisaties op basis van vrijwillig lidmaatschap' },
};

/**
 * Get NACE code description in specified language
 * Returns null if code is not found
 */
export function getNaceDescription(code: string, lang: 'fr' | 'nl' | 'en'): string | null {
  const description = NACE_CODES[code];
  if (!description) return null;
  // Fallback to French for English
  return description[lang === 'en' ? 'fr' : lang];
}

/**
 * Format NACE code with description
 * e.g., "62010 - Programmation informatique"
 */
export function formatNaceCode(code: string, lang: 'fr' | 'nl' | 'en'): string {
  const description = getNaceDescription(code, lang);
  return description ? `${code} - ${description}` : code;
}
