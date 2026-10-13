import { useStore } from "@nanostores/react"

import HomeHighlightCard from "./HomeHighlightCard"

import { polyglotState } from "@/hooks/useLanguage"

const HIGHLIGHT_SLOTS = ["primary", "secondary-1", "secondary-2"]

const HomeHighlights = ({ articleActivation, entries, highlightIds, observeRead }) => {
  const { polyglot } = useStore(polyglotState)
  // Resolve each ID in place: a vacant slot never promotes a surviving Secondary.
  const entryById = new Map()
  for (const entry of entries) {
    if (!entryById.has(entry.id)) {
      entryById.set(entry.id, entry)
    }
  }
  const seen = new Set()
  const slots = HIGHLIGHT_SLOTS.map((slot, index) => {
    const id = highlightIds[index]
    const entry = id == null || seen.has(id) ? null : entryById.get(id)
    if (!entry) {
      return null
    }
    seen.add(id)
    return (
      <div key={slot} className={`home-highlight-slot home-highlight-slot-${slot}`}>
        <HomeHighlightCard
          articleActivation={articleActivation}
          entry={entry}
          observeRead={observeRead}
          slot={slot}
        />
      </div>
    )
  })

  if (!slots.some(Boolean)) {
    return null
  }

  return (
    <section aria-label={polyglot.t("home_page.section_highlights")} className="home-highlights">
      <h2 className="home-section-heading">{polyglot.t("home_page.section_highlights")}</h2>
      {slots[0]}
      {slots.slice(1).some(Boolean) && (
        <div className="home-highlight-secondaries">{slots.slice(1)}</div>
      )}
    </section>
  )
}

export default HomeHighlights
