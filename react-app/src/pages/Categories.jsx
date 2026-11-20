import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES } from '../data/categories.js'
import CategoryCard from '../components/CategoryCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'

export default function Categories() {
  return (
    <div className="section py-10">
      <SectionHeading
        sub="Tap any craving to jump straight into Explore with that category pre-selected."
      >
        Food <span className="text-brand">Categories</span>
      </SectionHeading>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <h3 className="text-lg font-extrabold">Not sure what you’re craving?</h3>
          <p className="mt-1 text-sm text-ink/60">
            Browse every hygiene-rated vendor on the map — filter by area, category and score.
          </p>
        </div>
        <Link to="/explore" className="btn-primary shrink-0">
          Open Explore <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
