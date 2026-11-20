/**
 * Circular hygiene score badge (SVG ring, 0–5 scale).
 * Colour follows the score: green ≥ 4.5, amber ≥ 3.5, red below.
 */
export default function HygieneScore({ score, size = 58, showLabel = true }) {
  const has = score !== null && score !== undefined
  const pct = has ? Math.max(0, Math.min(1, score / 5)) : 0
  const r = (size - 7) / 2
  const c = 2 * Math.PI * r
  const color = !has ? '#9CA3AF' : score >= 4.5 ? '#18864B' : score >= 3.5 ? '#E8A200' : '#D64545'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="#fff" stroke="#E8F5E9" strokeWidth="6" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={has ? c * (1 - pct) : c}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-extrabold" style={{ fontSize: size * 0.3, color }}>
            {has ? score.toFixed(1) : '—'}
          </span>
        </span>
      </div>
      {showLabel && (
        <span className="text-[10px] font-bold tracking-wide text-ink/50 uppercase">Hygiene</span>
      )}
    </div>
  )
}
