import { Star } from 'lucide-react'

/**
 * Star rating — display mode, or interactive when onChange is provided.
 * Uses the brand orange so it stays inside the design palette.
 */
export default function RatingStars({ value = 0, onChange, size = 16, count, label }) {
  const stars = [1, 2, 3, 4, 5]

  if (!onChange) {
    return (
      <span className="flex items-center gap-1" aria-label={`Rated ${value} out of 5`}>
        <span className="flex">
          {stars.map((s) => (
            <Star
              key={s}
              width={size}
              height={size}
              className={s <= Math.round(value) ? 'fill-brand text-brand' : 'text-line'}
              strokeWidth={2}
            />
          ))}
        </span>
        <span className="text-sm font-bold text-ink/80">{Number(value).toFixed(1)}</span>
        {count !== undefined && (
          <span className="text-xs font-medium text-ink/50">({count})</span>
        )}
        {label && <span className="sr-only">{label}</span>}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1" role="radiogroup" aria-label={label || 'Rating'}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            width={size + 6}
            height={size + 6}
            className={s <= value ? 'fill-brand text-brand' : 'text-line hover:text-brand/50'}
            strokeWidth={2}
          />
        </button>
      ))}
      <span className="ml-1 text-sm font-bold text-ink/70">{value ? `${value}/5` : 'Rate'}</span>
    </span>
  )
}
