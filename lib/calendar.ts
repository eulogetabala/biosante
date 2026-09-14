/**
 * Arithmétique du calendrier.
 *
 * Isolée du composant d'affichage, et non par goût de l'abstraction : ces
 * quelques calculs de dates sont la partie la plus facile à casser sans qu'on
 * s'en aperçoive. Une semaine décalée d'un jour, et un rendez-vous se retrouve
 * affiché sous la mauvaise date — sans erreur, sans message.
 *
 * Tout est calculé en UTC. Les créneaux sont des chaînes « AAAA-MM-JJ » sans
 * fuseau ; les interpréter en heure locale ferait basculer une journée entière
 * selon le fuseau de la machine.
 */

/** Janvier = 0 dans `Date`, mais 1 dans nos clés « AAAA-MM ». */
const MONTHS_IN_YEAR = 12

/** Lundi premier jour de la semaine ; `getUTCDay` renvoie 0 pour dimanche. */
export function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

export const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export type CalendarCell = {
  /** Clé « AAAA-MM-JJ », utilisée pour rattacher les rendez-vous. */
  key: string
  day: number
  /** Faux pour les jours de remplissage, en début et fin de grille. */
  inMonth: boolean
}

function keyOf(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10)
}

/**
 * Grille du mois, complétée pour former des semaines entières.
 *
 * La grille commence toujours un lundi et son nombre de cases est un multiple
 * de sept : sans cela, la dernière semaine serait tronquée et l'alignement des
 * colonnes se décalerait selon le mois.
 */
export function buildMonth(monthKey: string): CalendarCell[] {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return []

  const monthIndex = month - 1
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const lead = mondayIndex(new Date(Date.UTC(year, monthIndex, 1)))

  const cells: CalendarCell[] = []

  // Jours du mois précédent, pour compléter la première semaine.
  const previousMonthDays = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  for (let offset = lead - 1; offset >= 0; offset -= 1) {
    const day = previousMonthDays - offset
    cells.push({ key: keyOf(year, monthIndex - 1, day), day, inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: keyOf(year, monthIndex, day), day, inMonth: true })
  }

  let next = 1
  while (cells.length % 7 !== 0) {
    cells.push({ key: keyOf(year, monthIndex + 1, next), day: next, inMonth: false })
    next += 1
  }

  return cells
}

/** Décale une clé « AAAA-MM » de `delta` mois, en passant les années. */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey

  const total = month - 1 + delta
  const shiftedYear = year + Math.floor(total / MONTHS_IN_YEAR)
  const shiftedMonth = ((total % MONTHS_IN_YEAR) + MONTHS_IN_YEAR) % MONTHS_IN_YEAR

  return `${shiftedYear}-${String(shiftedMonth + 1).padStart(2, '0')}`
}
