import type { DayPoint } from '@/lib/appointments'
import { formatDayShort } from '@/lib/appointments'

/**
 * Graphiques dessinés en SVG, sans bibliothèque.
 *
 * Recharts et consorts imposent leurs palettes et pèsent plusieurs centaines
 * de kilooctets pour trois tracés. Ici tout est explicite : quelques `path`,
 * des couleurs prises dans la charte, et aucune dépendance à maintenir.
 *
 * Aucune animation JavaScript : les tracés apparaissent d'un bloc. Sur une
 * console consultée au comptoir, une courbe qui se dessine lentement serait un
 * délai, pas un agrément.
 */

/** Boîte de dessin commune. Le viewBox s'adapte à la largeur disponible. */
const W = 720
const H = 190
const PAD = { top: 16, right: 10, bottom: 26, left: 30 }

const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

function line(values: number[], max: number): { d: string; points: [number, number][] } {
  const step = values.length > 1 ? innerW / (values.length - 1) : 0
  const points = values.map((value, index) => {
    const x = PAD.left + index * step
    const y = PAD.top + innerH - (max > 0 ? (value / max) * innerH : 0)
    return [x, y] as [number, number]
  })

  const d = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  return { d, points }
}

/**
 * Deux courbes sur un même axe : les demandes reçues et les rendez-vous
 * confirmés, jour par jour.
 *
 * Un axe unique et non deux : les deux séries comptent des demandes, donc
 * partagent la même échelle. Deux axes verticaux donneraient l'illusion d'un
 * croisement qui n'existe pas.
 */
export function ActivityChart({ data }: { data: DayPoint[] }) {
  const max = Math.max(1, ...data.map((point) => Math.max(point.recues, point.confirmees)))
  const recues = line(data.map((point) => point.recues), max)
  const confirmees = line(data.map((point) => point.confirmees), max)

  // Aire sous la courbe principale : ferme la ligne sur la base du graphique.
  const area = recues.d
    ? `${recues.d} L${PAD.left + innerW} ${PAD.top + innerH} L${PAD.left} ${PAD.top + innerH} Z`
    : ''

  // Une graduation sur trois suffit : au-delà, les étiquettes se chevauchent
  // dès que la fenêtre rétrécit.
  const labelEvery = data.length > 10 ? 3 : 2

  return (
    <svg
      className="ad-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Demandes reçues et rendez-vous confirmés par jour"
    >
      {[0, 0.5, 1].map((ratio) => {
        const y = PAD.top + innerH * ratio
        return (
          <line key={ratio} className="ad-chart__grid" x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} />
        )
      })}

      {area ? <path className="ad-chart__area" d={area} /> : null}

      <path className="ad-chart__line" d={recues.d} />
      <path className="ad-chart__line" d={confirmees.d} style={{ stroke: 'var(--leaf)' }} />

      {recues.points.map(([x, y], index) => {
        if (data[index].recues === 0) return null
        return <circle key={`r${index}`} className="ad-chart__dot" cx={x} cy={y} r={2.6} />
      })}
      {confirmees.points.map(([x, y], index) => {
        if (data[index].confirmees === 0) return null
        return (
          <circle
            key={`c${index}`}
            className="ad-chart__dot"
            style={{ stroke: 'var(--leaf)' }}
            cx={x}
            cy={y}
            r={2.6}
          />
        )
      })}

      {data.map((point, index) => {
        if (index % labelEvery !== 0 && index !== data.length - 1) return null
        const x = PAD.left + (data.length > 1 ? (innerW / (data.length - 1)) * index : innerW / 2)
        return (
          <text key={`x${index}`} className="ad-chart__axis" x={x} y={H - 8} textAnchor="middle">
            {formatDayShort(point.date)}
          </text>
        )
      })}
    </svg>
  )
}

/**
 * Beignet : répartition des demandes par type d'analyse.
 *
 * Arcs calculés à la main plutôt que tracés en `<circle>` avec des pointillés :
 * la technique des pointillés oblige à ajuster un `stroke-dasharray` au pixel
 * et dérive dès que les proportions changent. Ici chaque part est un arc
 * fermé, exact par construction.
 *
 * Une part unique occupe la totalité du cercle : un arc ne peut pas couvrir
 * 360° (son point de départ et son point d'arrivée se confondent), on dessine
 * donc un cercle plein dans ce cas.
 *
 * Le nombre de parts est borné à la source (`summarize`) : au-delà de six
 * teintes, plus personne ne distingue les segments sur un cercle de cette
 * taille.
 */

const PALETTE = [
  'var(--brand)',
  'var(--brand-light)',
  '#7c5cd6',
  'var(--leaf)',
  '#e0a02e',
  'var(--muted-foreground)',
]

function polar(cx: number, cy: number, radius: number, angleDeg: number): [number, number] {
  // -90° place la première part en haut du cercle, comme sur le modèle.
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
}

export function Donut({
  data,
  centerLabel,
}: {
  data: { label: string; count: number }[]
  centerLabel: string
}) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  if (total === 0) {
    return <p className="ad-panel__hint">Aucune donnée à répartir pour l’instant.</p>
  }

  const cx = 60
  const cy = 60
  const outer = 54
  const thickness = 17
  const inner = outer - thickness

  let angle = 0
  const segments = data.map((entry, index) => {
    const sweep = (entry.count / total) * 360
    const start = angle
    angle += sweep
    return { ...entry, start, sweep, color: PALETTE[index % PALETTE.length] }
  })

  return (
    <div className="ad-donut">
      <svg
        className="ad-donut__svg"
        viewBox="0 0 120 120"
        role="img"
        aria-label="Répartition des demandes par type d’analyse"
      >
        {segments.length === 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(outer + inner) / 2}
            fill="none"
            stroke={segments[0].color}
            strokeWidth={thickness}
          />
        ) : (
          segments.map((segment) => {
            const [x1, y1] = polar(cx, cy, outer, segment.start)
            const [x2, y2] = polar(cx, cy, outer, segment.start + segment.sweep)
            const [x3, y3] = polar(cx, cy, inner, segment.start + segment.sweep)
            const [x4, y4] = polar(cx, cy, inner, segment.start)
            const large = segment.sweep > 180 ? 1 : 0

            return (
              <path
                key={segment.label}
                className="ad-donut__seg"
                fill={segment.color}
                d={`M${x1} ${y1} A${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`}
              />
            )
          })
        )}

        <text
          className="ad-donut__center"
          x={cx}
          y={cy - 1}
          textAnchor="middle"
          fontSize="17"
          fill="var(--foreground)"
        >
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="var(--muted-foreground)">
          {centerLabel}
        </text>
      </svg>

      <div className="ad-donut__legend">
        {segments.map((segment) => (
          <div className="ad-donut__row" key={segment.label}>
            <i style={{ background: segment.color }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {segment.label}
            </span>
            <b>{Math.round((segment.count / total) * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Barres horizontales : charge par tranche horaire.
 *
 * Horizontales et non verticales : les libellés (« Après-midi ») sont longs, et
 * un axe horizontal les laisserait se chevaucher dès que la largeur diminue.
 *
 * Part rapportée au total et non au maximum : chaque barre se lit alors comme
 * une part de la journée, ce qui est la question posée (« où se concentre la
 * charge ? »).
 */
export function HourBuckets({ data }: { data: { label: string; count: number }[] }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0)

  if (total === 0) {
    return <p className="ad-panel__hint">Aucun rendez-vous confirmé à répartir.</p>
  }

  return (
    <div className="ad-bd">
      {data.map((entry) => (
        <div className="ad-bd__row" key={entry.label}>
          <span className="ad-bd__name">{entry.label}</span>
          <span className="ad-bd__n">{entry.count}</span>
          <span className="ad-bd__track">
            <span className="ad-bd__fill" style={{ width: `${(entry.count / total) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  )
}
