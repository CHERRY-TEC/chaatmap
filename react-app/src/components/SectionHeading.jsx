/** Centered section heading with optional accent word and right-side link. */
export default function SectionHeading({ children, accent, action, sub }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {children}{' '}
          {accent && <span className="text-brand">{accent}</span>}
        </h2>
        {sub && <p className="mt-2 max-w-2xl text-sm text-ink/60">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
