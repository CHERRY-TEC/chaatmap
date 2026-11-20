import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/** Image category card — click opens Explore with this category selected. */
export default function CategoryCard({ category, compact = false }) {
  const [imgOk, setImgOk] = useState(true)
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/explore?category=${category.id}`)}
      className="card group flex flex-col overflow-hidden text-left transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_14px_32px_rgba(33,27,25,0.10)]"
    >
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 ${
          compact ? 'aspect-[4/3]' : 'aspect-[5/4]'
        }`}
      >
        {imgOk ? (
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-5xl">
            {category.emoji}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 px-3 py-3">
        <div>
          <p className="text-sm font-extrabold">{category.name}</p>
          <p className="text-[11px] font-semibold text-ink/50">{category.vendors} vendors</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-brand opacity-0 transition group-hover:opacity-100" />
      </div>
    </button>
  )
}
