import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const sectionLabels = {
  "de-DE": ["Highlights", "Neueste"],
  "en-US": ["Highlights", "Latest"],
  "es-ES": ["Destacados", "Más recientes"],
  "fr-FR": ["À la une", "Plus récents"],
  "ja-JP": ["注目記事", "最新記事"],
  "zh-CN": ["精选", "最新文章"],
}

test("Home editorial section headings are translated in every shipped locale", () => {
  for (const [locale, [highlights, recent]] of Object.entries(sectionLabels)) {
    const phrases = JSON.parse(
      readFileSync(new URL(`../locales/${locale}.json`, import.meta.url), "utf8"),
    )
    assert.equal(phrases.home_page.section_highlights, highlights, `${locale} highlights`)
    assert.equal(phrases.home_page.section_recent, recent, `${locale} recent`)
  }
})
