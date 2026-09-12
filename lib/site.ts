export type Labo = {
  id: string
  name: string
  short: string
  number: string
  address: string
  landmark: string
  phone: string
  tel: string
  hours: string
  hoursNote: string
  maps: string
  image: string
  /**
   * Position du repère sur la carte.
   * `exact` : coordonnée du bâtiment (précision ~10 m).
   * `approx` : repère posé sur le quartier, à ajuster dès qu'on relève le point GPS exact.
   */
  geo: { lat: number; lng: number; precision: 'exact' | 'approx' }
}

export const labos: Labo[] = [
  {
    id: 'mpila',
    name: 'Laboratoire Mpila',
    short: 'Mpila',
    number: 'A1',
    address: 'Résidence Les Pionniers, Bâtiment 9',
    landmark: 'Quartier Dragage — en diagonale de la Pharmacie Adèle',
    phone: '+242 06 763 7979',
    tel: '+242067637979',
    hours: 'Lun → Sam · 07:30 – 18:00',
    hoursNote: 'Dimanche : urgences sur appel',
    maps: 'https://www.google.com/maps/search/?api=1&query=R%C3%A9sidence+Les+Pionniers+Brazzaville',
    image:
      'https://images.unsplash.com/photo-1583911860367-8b9fa77c6f4c?auto=format&fit=crop&w=1200&q=85',
    geo: { lat: -4.24817, lng: 15.29908, precision: 'approx' },
  },
  {
    id: 'flamboyants',
    name: 'Laboratoire Cité Flamboyants',
    short: 'Cité Flamboyants',
    number: 'A2',
    address: '02 Avenue de la Liberté, Cité Flamboyants',
    landmark: 'Référence Hôpital Militaire',
    phone: '+242 06 765 7878',
    tel: '+242067657878',
    hours: 'Lun → Sam · 07:30 – 18:00',
    hoursNote: 'Dimanche : urgences sur appel',
    maps: 'https://www.google.com/maps/search/?api=1&query=Avenue+de+la+Libert%C3%A9+Brazzaville',
    image:
      'https://images.unsplash.com/photo-1631816290138-9f0f79cada3b?auto=format&fit=crop&w=1200&q=85',
    geo: { lat: -4.27438, lng: 15.26651, precision: 'exact' },
  },
]

export type Service = {
  title: string
  text: string
  number: string
  meta: string
  image: string
}

export const services: Service[] = [
  {
    title: 'Hématologie',
    text: 'Le sang, ses cellules et ses équilibres.',
    number: '01',
    meta: 'Numération · Formule · Vitesse',
    image:
      'https://images.unsplash.com/photo-1582719366767-dbbb6c6bf4aa?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Immuno-sérologie',
    text: 'Comprendre les réponses immunitaires.',
    number: '02',
    meta: 'Dépistage · Suivi · Expertise',
    image:
      'https://images.unsplash.com/photo-1630959302878-a30de73cdbb5?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Microbiologie',
    text: 'Identifier pour mieux traiter.',
    number: '03',
    meta: 'Bactéries · Virus · Champignons',
    image:
      'https://images.unsplash.com/photo-1579154204845-5d7f8d4dc785?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Biochimie & Biologie moléculaire',
    text: 'Les marqueurs au cœur du vivant.',
    number: '04',
    meta: 'ADN · Marqueurs · Diagnostic',
    image:
      'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Hormonologie',
    text: 'Un dosage précis à chaque étape.',
    number: '05',
    meta: 'Équilibre · Cycle · Vitalité',
    image:
      'https://images.unsplash.com/photo-1569830904560-2afd7062213c?auto=format&fit=crop&w=900&q=85',
  },
  {
    title: 'Toxicologie',
    text: 'Recherche et dosage des substances.',
    number: '06',
    meta: 'Contrôle · Sécurité · Clarté',
    image:
      'https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?auto=format&fit=crop&w=900&q=85',
  },
]

export type ExamGroup = {
  name: string
  family: string
  items: string[]
}

export const examGroups: ExamGroup[] = [
  {
    name: 'Hématologie',
    family: 'Sang',
    items: [
      'Numération formule sanguine (NFS)',
      'Vitesse de sédimentation (VS)',
      'Groupe sanguin & Rhésus',
      'Taux de prothrombine (TP / INR)',
      'Temps de céphaline activé (TCA)',
      'Réticulocytes, plaquettes',
    ],
  },
  {
    name: 'Biochimie',
    family: 'Métabolisme',
    items: [
      'Glycémie à jeun',
      'Bilan lipidique complet',
      'Créatinine & urée',
      'Transaminases (ASAT / ALAT)',
      'Bilirubine totale et conjuguée',
      'Ionogramme sanguin',
    ],
  },
  {
    name: 'Immuno-sérologie',
    family: 'Immunité',
    items: [
      'Groupe sanguin étendu',
      'Sérologie VIH, hépatites B et C',
      'Widal & Felix (typhoïde)',
      'Test de grossesse (β-HCG)',
      'Facteur rhumatoïde',
      'Recherche d’anticorps irréguliers',
    ],
  },
  {
    name: 'Microbiologie',
    family: 'Recherche d’agents',
    items: [
      'Examen cytobactériologique des urines (ECBU)',
      'Goutte épaisse & TDR paludisme',
      'Coproculture et parasitologie des selles',
      'Prélèvement vaginal',
      'Culture avec antibiogramme',
      'Recherche de BK (bacilloscopie)',
    ],
  },
  {
    name: 'Hormonologie',
    family: 'Dosages',
    items: [
      'TSH, T3, T4',
      'FSH, LH, prolactine',
      'Œstradiol, progestérone',
      'Testostérone',
      'Cortisol',
      'Antigène prostatique spécifique (PSA)',
    ],
  },
  {
    name: 'Toxicologie',
    family: 'Substances',
    items: [
      'Alcoolémie',
      'Recherche de drogues (screening)',
      'Métaux lourds',
      'Bilan toxicologique professionnel',
    ],
  },
]

/** Créneaux de rendez-vous, groupés matin / après-midi. */
export const timeSlotGroups = [
  {
    label: 'Matin',
    slots: ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  },
  {
    label: 'Après-midi',
    slots: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
  },
]

export const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/laboratoire', label: 'Le laboratoire' },
  { href: '/services', label: 'Nos services' },
  { href: '/contact', label: 'Contact' },
]

export type Country = {
  iso: string
  name: string
  dial: string
}

export const countries: Country[] = [
  { iso: 'CG', name: 'Congo Brazzaville', dial: '+242' },
  { iso: 'CD', name: 'Congo (RDC)', dial: '+243' },
  { iso: 'CM', name: 'Cameroun', dial: '+237' },
  { iso: 'GA', name: 'Gabon', dial: '+241' },
  { iso: 'TD', name: 'Tchad', dial: '+235' },
  { iso: 'CF', name: 'République centrafricaine', dial: '+236' },
  { iso: 'GQ', name: 'Guinée équatoriale', dial: '+240' },
  { iso: 'AO', name: 'Angola', dial: '+244' },
  { iso: 'SN', name: 'Sénégal', dial: '+221' },
  { iso: 'CI', name: 'Côte d’Ivoire', dial: '+225' },
  { iso: 'NG', name: 'Nigéria', dial: '+234' },
  { iso: 'ZA', name: 'Afrique du Sud', dial: '+27' },
  { iso: 'MA', name: 'Maroc', dial: '+212' },
  { iso: 'FR', name: 'France', dial: '+33' },
  { iso: 'BE', name: 'Belgique', dial: '+32' },
  { iso: 'CH', name: 'Suisse', dial: '+41' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'US', name: 'États-Unis', dial: '+1' },
]

export const defaultCountry = countries[0]

export function flagEmoji(iso: string) {
  return String.fromCodePoint(...[...iso].map((c) => 127397 + c.charCodeAt(0)))
}

export const site = {
  name: 'Groupe Bio Santé Diagnostic',
  tagline: 'La précision au service de santé',
  email: 'contact@grbiosante.com',
  domain: 'grbiosante.com',
  city: 'Brazzaville · République du Congo',
  logo: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-08-21%20at%2016.44.09-wzND914nYQCTIBPoB6Yv14YSs1Wd2n.jpeg',
}
