# NewsFlux Phase 2C — Editorial Home Architecture

**Status:** Design approved; implementation not started
**Date:** 2026-10-12
**Repository base:** main at 28fe942beaada7de0553cb3b3cbc54e43e01b845
**Scope:** One deterministic, unread-oriented editorial Home at the root route

## 1. Purpose and product intent

Phase 2C introduces a real editorial Home at /. It replaces the current configurable redirect at that route with a composed editorial cover.

The Home will:

- keep All and Unread deterministic and predictable;
- use the existing Miniflux-backed article pipeline;
- compose content deterministically, without personalization, behavioral history, or machine learning;
- preserve NewsFlux’s OLED-aware editorial design and Liquid Glass navigation-chrome contract;
- keep the fork maintainable against upstream.

Phase 2C Home is an unread-oriented editorial cover. It is not personalized.

## 2. Routing and startup contract

The root route has one meaning:

- / renders the real editorial Home;
- reload and bookmark at / remain on Home;
- the Home/logo action always navigates to /.

Existing list and article surfaces remain semantically independent: /all, the Unread filter, Today, Starred, History, Feed, Category, and article/deep-link surfaces. Home must not change their meaning or their ordering behavior.

The setting historically named as the Home page is repurposed as “Página após login.” It applies only after an explicit authentication/login entry and selects the destination after login. It does not redefine / and must not intercept an explicit deep link. Explicit deep links always take precedence over the post-login preference.

For the current NewsFlux deployment, the migrated value is Página após login = Home (/). Reuse the existing settings/localStorage persistence mechanism; add no persistent storage.

A new authentication flow, Sidebar redesign, NAV-01, and NAV-02 are out of scope.

## 3. Canonical Home data contract

Home uses one paginated article session and one query with these fixed semantics:

- status: unread;
- order: published_at;
- direction: descending;
- visibility: the existing feed/source visibility policy;
- pagination: the existing mechanism and cursor;
- Home-specific search filter: none;
- Home-specific date filter: none.

Home order is always published_at descending. All/Unread sort preferences do not change Home, and All/Unread behavior remains untouched.

Home does not add a query per section, an independent cursor per section, a separate article cache, or a new source of truth. Miniflux remains the source of truth for articles, read/unread, starred, feed/category, timestamps, and counts.

## 4. One loaded set and presentation projection

The first page returns N unread entries. Those same N entries are projected into up to three Highlights and the remaining Recent entries. Highlights do not add records beyond the page size.

For example, with pageSize 20 and three Highlights, Recent contains 17 entries and total loaded entries remains 20.

Home presentation deduplication uses entry.id. An ID rendered in Highlights must not also render in Recent. Do not use the existing functional deduplication by title/hash/URL for Home presentation.

## 5. Initial Highlight selection

Eligibility requires that an entry is unread, allowed by the existing source/feed visibility policy, and present in the loaded entries. Starred is not relevance. Selection must not use click/open history, dwell/scroll history, affinity, popularity, behavioral history, or machine learning.

On initial composition and explicit refresh:

**Primary:** choose the newest eligible entry by published_at. Image availability does not affect Primary selection.

**Secondary 1:** compare eligible entries in this priority order:
1. source differs from Primary;
2. category differs from Primary;
3. newer published_at;
4. image presence, only as a late tie-break;
5. stable entry.id tie-break.

**Secondary 2:** compare remaining eligible entries in this priority order:
1. prefer a source not yet represented, when possible;
2. prefer a category not yet represented, when possible;
3. newer published_at;
4. image presence, only as a late tie-break;
5. stable entry.id tie-break.

Source/category diversity is preferred but is not an eligibility requirement. When all candidates share a source or category, still select valid candidates.

For Secondary selection, an image tie-break means preferring an entry with an eligible, usable image under the existing article presentation/image semantics only after source diversity, category diversity, and recency tie. Image presence never overrides any of those higher-priority criteria, never affects Primary selection, and lack of an image never makes an entry ineligible.

Initial counts:
- at least three eligible entries: three Highlights;
- two eligible entries: two Highlights;
- one eligible entry: one Highlight;
- no eligible entries after a successful canonical query with zero unread: global “Tudo em dia” state.

Do not fetch additional entries solely to complete three Highlights.

## 6. Highlight stability

After initial composition, highlightIds are stable ephemeral session state. Do not recompute Highlights merely because of scroll, load-more, star/unstar, mark-unread, or opening/closing the reader.

Load-more appends entries to Recent and expands the loaded candidate pool, but it does not fill an empty Highlight slot or reorganize existing Highlights.

On successful explicit refresh, fetch canonical Home data, discard the previous editorial projection, and recompute Highlights from scratch. If an explicit refresh fails after valid Home content exists, preserve the current projection as specified in §26.

## 7. Successful read mutation and one-slot backfill

Reuse the existing functional mutation pipeline; do not create a separate mutation system. On successful mark-read, the article is ineligible and is removed from Home.

If the read article occupied a Highlight:
- vacate exactly that slot;
- choose a backfill candidate only from currently loaded, eligible entries in Recent;
- rank candidates relative to the Highlights that survive in their existing slots, preferring in order: a source not already represented by those surviving Highlights, a category not already represented, newer published_at, an eligible/usable image, then the stable entry.id tie-break;
- promote that candidate to the vacant slot and remove its entry.id from Recent;
- preserve all other Highlight positions;
- do not fetch more entries.

Source and category are soft diversity preferences, never eligibility requirements. Apply each preference when it distinguishes the candidates; when surviving Highlights provide no meaningful distinction, or all candidates are already represented, fall through to the next criterion. Image presence is only a late tie-break after source diversity, category diversity, and recency; it never overrides them, never affects Primary selection, and absence of an image never disqualifies a candidate.

The same comparator applies whether the vacancy is Primary or Secondary. It applies only to the vacant slot: do not move or reorder surviving Highlights. If no loaded eligible Recent candidate exists, temporarily show fewer Highlights. The “Primary is newest” guarantee applies to initial composition and successful explicit refresh only. During mutation backfill, session stability takes precedence over recomputing Highlight order.

Do not commit structural backfill based only on an unconfirmed mutation. If the mutation fails, reconcile with existing Miniflux-backed functional state and ensure no removal or backfill derived from that failed mutation survives.

## 8. Mark unread

After successful mark-unread, an article becomes eligible for Home again only if it is within the active loaded/visible universe. Insert it into Recent in published_at descending order. Do not promote it to Highlights or reorganize existing Highlights. An explicit refresh may later select it as a Highlight.

Do not fetch specifically to recover an article outside the current loaded set.

## 9. Star and unstar

Star/unstar updates normal article state but does not affect Highlight eligibility or position and does not trigger recomposition. Starred is user state, not Phase 2C editorial relevance or a tie-break criterion.

## 10. Pagination

Home has one pagination chain and one sentinel owned by the overall Home composition. Its conceptual order is:

1. Highlights;
2. Recent;
3. the shared sentinel.

Load-more uses the same Home query and cursor. New entries render in Recent; Highlights remain stable. Pagination must continue to work when Recent is visually empty but more server pages exist. The sentinel must not be owned by an independent Recent query.

New entries follow the canonical query order and are appended to Recent in published_at descending order.

## 11. Ephemeral Home session state

Home may maintain ephemeral state equivalent to a HomeEditorialSession containing request/session identity, loaded entries from the existing data pipeline, highlightIds, and scroll position or existing restoration state.

Do not persist editorial composition in localStorage, sessionStorage, IndexedDB, a backend, or Miniflux. Reuse existing settings persistence only for configuration. Home editorial state remains ephemeral.

## 12. Session invalidation and stale responses

The current composition may remain stable across scrolling, load-more, opening/closing the reader, star/unstar, and mark-unread.

Rebuild it on explicit refresh, creation of a new Home session after the prior session was discarded, authenticated server/identity change, source/feed visibility-policy change, or invalidation of the functional Home request/session identity.

Reuse existing stale-request and session-revision protections. A response from an old Home session must never mutate a newer session. Do not duplicate stale-session machinery when it can be reused.

## 13. Reader origin and return

Opening an article from Home has origin /. Closing or browser Back from ArticleDetail returns to /, preserves the same valid editorial session, does not implicitly refresh/recompute Highlights, and approximately restores Home scroll.

If the article becomes read successfully while in the reader, it must not reappear on Home return. Apply the approved loaded-only one-slot backfill when applicable; leave other Highlight positions stable.

Do not create a separate Highlights reader queue. Preserve existing article navigation/swipe semantics as much as possible. NAV-01 remains out of scope.

## 14. Counts and Mark All Read

Home has no independent editorial count source; existing count machinery remains the functional source of truth. Phase 2C Home must not expose Mark All Read.

Existing list-view Mark All Read behavior must remain intact, including MARK_ALL_READ_SUCCESS, MARK_ALL_READ_FILTER_SCOPE, MARK_ALL_READ_NO_JUMP_ON_FAILURE, MARK_ALL_READ_JUMP_TO_NEXT, STALE_SESSION_PROTECTION, PARTIAL_FAILURE_RECONCILIATION, and COUNTS_REFRESH.

## 15. Visual structure

Home contains:

- Destaques: one Primary editorial Highlight and up to two Secondary Highlights;
- Mais recentes: existing editorial Grid cards.

Content surfaces remain opaque. Liquid Glass remains chrome-only. Home adds no glow, translucent content, decorative glass cards, or carousel.

## 16. Primary Highlight

Primary is a larger editorial card in the established NewsFlux visual language. It may use a larger footprint, stronger title hierarchy, a more generous deck, existing metadata/actions, and a larger real image when one exists.

It must not become an unrelated banner, a glass surface, glow-heavy, or advertisement-like.

When Primary has no image, it remains Primary. Do not promote another article because it has media. Render an intentional text-only editorial hero with title, deck, metadata, and whitespace. Do not use an image placeholder or reserve empty media space.

## 17. Secondary Highlights

The two Secondary Highlights are visually equivalent. At sufficient width they use two columns; on narrow mobile/Fold they stack vertically. They use the existing card language and preserve article actions/status semantics. Each works with or without an image; do not assign image/text-only roles based on slot.

## 18. Recent

Recent reuses the existing editorial Grid. Do not introduce a compact-list language. Preserve approved Phase 2B.2C behavior: image cards, text-only treatment, unread marker, read/unread title treatment, favorite state, metadata/footer/decks, and responsive Grid semantics. Phase 2C does not redesign Grid cards.

## 19. Section headers and controls

Use simple editorial headings: Destaques and Mais recentes. Add no counters, “Ver tudo,” chips, sort/direction controls, date selector, or All/Unread selector. Home semantics are fixed.

Search remains a global action using its existing separate search/list behavior; it does not reconfigure Home composition in place.

## 20. Responsive contract

Mobile/narrow Fold is single-pane: Primary, Secondary 1, Secondary 2, then one-column Recent Grid. No carousel or Home-specific horizontal gesture.

At the critical 884x1104 viewport, Primary spans the module width; the two secondaries use two columns; Recent uses two columns; the composition reads intentionally for tablet/Fold-like width.

Desktop keeps Primary editorially dominant, secondaries in two columns, and Recent in the existing Grid up to its current maximum columns. Do not turn Home into a dense dashboard.

At 1024x768, explicitly validate vertical density so Highlights do not consume effectively the entire useful first viewport.

Required viewport matrix: 390x844, 768x1024, 884x1104, 1024x768, 1280x800, and 1440x900.

## 21. Density

Hierarchy must be visible without gigantism. Primary is stronger than a normal Grid card but not so tall that Recent becomes undiscoverable. Secondary Highlights remain balanced and scannable. At 884x1104, the user should understand that Recent continues below Highlights without accidental discovery.

## 22. Initial loading

Create Home-specific editorial skeleton structure: one Primary skeleton, two Secondary skeletons, and Grid-compatible Recent skeletons. Approximate final geometry, use opaque surfaces, avoid a central spinner as the primary experience and avoid aggressive shimmer. Do not assume every final article has an image.

Do not use Phase 2C to authorize unrelated global skeleton refactoring. The known skeleton column-count mismatch remains backlog unless the minimum Home implementation specifically requires a bounded fix.

## 23. Low unread counts

- Three or more unread: up to three Highlights; the remainder of the loaded entries is Recent.
- Two unread: two Highlights; Recent may be absent.
- One unread: one Highlight; Recent is absent.
- Zero unread: global “Tudo em dia.”

Do not fabricate cards to maintain geometry.

## 24. Empty Recent

When Recent has zero entries, omit its heading, empty container, and section empty-state message. This is normal when all loaded unread entries are Highlights and is distinct from zero unread globally.

## 25. Zero unread and “Tudo em dia”

When the successful canonical Home query returns zero unread, stay on / and render a calm editorial “Tudo em dia” state. Do not automatically show read articles or redirect to /all.

An explicit CTA to /all is allowed with wording such as “Ver todos os artigos.” Final wording can be refined during UI implementation without changing these semantics.

## 26. Initial and explicit refresh errors

When the initial Home query fails, remain on / and show a clear global Home error with “Tentar novamente.” Retry the same canonical query. Do not redirect to /all or show “Tudo em dia.”

When an explicit refresh fails after valid Home content is already loaded, preserve the currently valid Highlights, Recent entries, and editorial session/projection. Do not replace Home with the initial global error state or recompute Highlights. Clearly show that the refresh failed and provide a retry action; do not imply that the visible content was freshly updated successfully. This Home-level refresh error is distinct from the local load-more error at the end of Recent. A later successful refresh follows §6: it may replace the canonical loaded data, discard the prior projection, and recompute Highlights from scratch.

## 27. Load-more error

When a later pagination request fails after valid Home content exists, preserve existing Highlights and Recent, stop loading indication, and offer a local retry at the end. Do not replace the whole Home with the initial global error state.

## 28. Interactions and accessibility

Home cards retain supported existing actions: open article, read/unread, favorite, and compatible menu actions where applicable. There are no Highlight-specific actions.

Use semantic section headings and logical DOM order: Primary before secondaries, then Recent. Secondary order is deterministic. Preserve keyboard access and visible focus; do not rely on hover or image-dependent semantics. Stacked mobile order matches reading order.

## 29. Themes and design contract

Support light and dark/OLED themes. Preserve the OLED-aware canvas, editorial hierarchy, Material interactions, and Liquid Glass chrome-only contract. Cards, article/content surfaces, images, reader, and general content surfaces remain opaque. Add no glow or glass treatment inside Home article cards.

## 30. Component and architectural boundaries

Recommended conceptual boundary:

- HomePage
  - HomeEditorialSession
  - HomeHighlights
    - Primary
    - Secondaries
  - HomeRecent
  - HomeLoading
  - HomeEmpty
  - HomeError

Exact names follow repository conventions.

Do not force all Home behavior into Content.jsx. Do not turn ArticleList into a generic multi-section editorial framework unless repository inspection proves that a minimal isolated hook/slot is necessary. Do not create a fully independent Home fetching/mutation subsystem. Reuse the existing article/data/mutation functional core while isolating editorial projection and presentation.

## 31. Projection layer

Editorial selection is testable without DOM, at a boundary equivalent to selectInitialHighlights(...), selectBackfillCandidate(...), and projectRecentEntries(...), or an equivalent focused pure-function model.

Fetching code does not know presentation ranking. Article cards do not know why they are Highlights or Recent. The reader contains no ranking logic. Mutation code contains no visual-layout logic. This is the extension point for possible Phase 2D personalization; Phase 2C itself remains deterministic.

## 32. Card reuse

Avoid duplicating ArticleGridCard wholesale into a second behavioral card. Prefer existing data/actions, a reusable card primitive/behavior, and a Home-specific wrapper/variant/composition.

A Home-specific presentation wrapper/variant is allowed if the existing Grid card cannot express Primary hierarchy cleanly. It must not alter normal Grid behavior, add extensive Home-specific branching to Grid, or duplicate mutation behavior.

## 33. Content.jsx boundary

Content.jsx already carries important origin/list/article responsibilities. Do not refactor it broadly as part of Phase 2C. Only make minimum integration required for Home origin, reader return, Home session reuse, and the shared data pipeline.

Do not put the Highlight algorithm, Home visual layout, Home skeleton logic, or diversity ranking directly into Content.jsx unless unavoidable and explicitly justified. Report unrelated findings to backlog; do not fix them in this work.

## 34. Pure-logic test strategy

At minimum, test:

- zero, one, two, and three-or-more entries;
- newest Primary on initial composition;
- source diversity priority;
- category diversity priority;
- recency after diversity;
- image presence as a late tie-break for Secondary selection/backfill only, never for Primary selection or eligibility;
- stable entry.id tie-break;
- valid selection when candidates share source/category;
- no entry rendered in both sections;
- star/unstar does not change placement;
- load-more does not recompute Highlights;
- mark-unread returns an entry to Recent;
- successful read of Primary and Secondary each cause one-slot backfill;
- backfill candidate preference is source diversity, category diversity, recency, usable-image presence, then stable entry.id, relative to surviving Highlights;
- Primary and Secondary vacancy backfill each preserve every surviving Highlight slot;
- read failure does not commit an editorial transition;
- refresh completely recomputes the projection.

## 35. Home functional gates

Require at least:

- HOME_ROUTE_ROOT
- HOME_LOGO_ROOT
- HOME_POST_LOGIN_PREFERENCE
- HOME_DEEP_LINK_NOT_INTERCEPTED
- HOME_UNREAD_ONLY
- HOME_PUBLISHED_AT_DESC
- HOME_FEED_VISIBILITY_INHERITED
- HOME_ONE_QUERY
- HOME_ONE_CURSOR
- HOME_MAX_THREE_HIGHLIGHTS
- HOME_PRIMARY_NEWEST
- HOME_SECONDARY_SOURCE_DIVERSITY
- HOME_SECONDARY_CATEGORY_DIVERSITY
- HOME_IMAGE_ONLY_TIEBREAK
- HOME_DEDUPE_BY_ENTRY_ID
- HOME_NO_EXTRA_HIGHLIGHT_FETCH
- HOME_LOAD_MORE_STABLE
- HOME_REFRESH_RECOMPOSES
- HOME_READ_SUCCESS_REMOVES
- HOME_READ_BACKFILL
- HOME_READ_FAILURE_RECONCILES
- HOME_MARK_UNREAD_RECENT
- HOME_STAR_POSITION_STABLE
- HOME_READER_ORIGIN
- HOME_READER_RETURN
- HOME_SCROLL_RESTORE
- HOME_ZERO_UNREAD
- HOME_INITIAL_ERROR
- HOME_REFRESH_ERROR_PRESERVES_CONTENT
- HOME_LOAD_MORE_ERROR

## 36. Existing regression gates

Retain:

- NO_ALL_RANKING
- NO_UNREAD_RANKING
- ALL_SORT_PREFERENCE_PRESERVED
- UNREAD_FILTER_PRESERVED
- MARK_ALL_READ_SUCCESS
- MARK_ALL_READ_FILTER_SCOPE
- MARK_ALL_READ_NO_JUMP_ON_FAILURE
- MARK_ALL_READ_JUMP_TO_NEXT
- STALE_SESSION_PROTECTION
- PARTIAL_FAILURE_RECONCILIATION
- COUNTS_REFRESH

## 37. Visual harness

Implementation must create a Phase 2C-specific visual/runtime harness. This specification does not implement that harness.

Cover all six required viewports (390x844, 768x1024, 884x1104, 1024x768, 1280x800, 1440x900) and light plus dark/OLED themes.

Scenarios: three or more unread with image Primary; three or more unread with text-only Primary; two unread; one unread; zero unread; mixed image/text-only; diverse source/category; same source/category; loading; initial error; failed explicit refresh with valid content retained and retry available; load-more error; after read/backfill; after mark-unread; after star/unstar.

Expected visual gates: HOME_NO_OVERFLOW, HOME_SECTION_HIERARCHY, HOME_PRIMARY_TEXT_ONLY, HOME_SECONDARY_LAYOUT, HOME_RECENT_GRID, HOME_EMPTY_RECENT, HOME_LOADING, HOME_REFRESH_ERROR_WITH_CONTENT, HOME_LIGHT, and HOME_DARK.

## 38. Real-device gate

Before the future implementation PR can merge, require a real-device gate at 884x1104 and at least one narrow mobile/Fold check.

Perceptual checklist:

- EDITORIAL_HIERARCHY_CLEAR
- PRIMARY_NOT_OVERSIZED
- SECONDARIES_BALANCED
- RECENT_VISIBLE_AS_CONTINUATION
- TEXT_ONLY_PRIMARY_FEELS_INTENTIONAL
- NO_GLASS_CONTENT_SURFACES
- OLED_SURFACE_SEPARATION
- NO_LAYOUT_JUMP_ON_READER_RETURN
- NO_UNEXPECTED_RECOMPOSE
- TOUCH_TARGETS_USABLE
- MOBILE_SINGLE_PANE

## 39. Deployment governance

Future implementation validation deploys only an exact approved SHA. Never deploy an implicit branch latest.

Deployment contract:

- stack: /dockerdata/compose/newsflux
- repository: /dockerdata/compose/newsflux/repo
- container: newsflux
- image: newsflux-local:<shortcommit>
- network: npm-proxyyml_default
- internal URL: http://newsflux:2000

Expected sequence: exact SHA, exact image, compose validation, recreate, HTTP probe, container/network verification, Miniflux health, then real-device gate.

## 40. Out of scope

Explicitly exclude upstream sync; NAV-01 SWIPE_TO_OPEN_FEED_SELECTOR; NAV-02 UNREAD_FIRST_FEED_SELECTOR; Phase 2D personalization; behavioral history; ML ranking; a new persistent user-state database; unrelated Grid card redesign; Sidebar redesign; reader redesign; Liquid Glass recalibration; SEARCH_QUERY_CLEARED_ON_ARTICLE_CLOSE; HydrateFallback cleanup; unrelated global skeleton cleanup; and incidental FooterPanel/Content cleanup.

Report incidental issues to backlog; do not fix them as part of Phase 2C.

## 41. Residual risks

- **R1 — Virtualization/sentinel integration:** current list architecture is designed around one paginated list; Home adds finite editorial content before the continuation stream.
- **R2 — Reader navigation:** origin / must be preserved without introducing a separate editorial reader queue.
- **R3 — Startup preference migration:** old configurable Home semantics become “Página após login” without intercepting explicit / or deep links and without unnecessary persistence.
- **R4 — Card reuse versus hero flexibility:** excessive reuse can weaken Primary; excessive specialization can duplicate behavior.
- **R5 — Home session stability:** preserve highlightIds across legitimate reader return while invalidating correctly on true session/visibility changes.

Do not solve these risks speculatively in this documentation task. The implementation-plan decision points below must be settled before implementation begins.

## 42. Definition of done

Phase 2C is complete only after all of these pass:

**Routing:** / is real Home; Home/logo opens /; post-login preference works; deep links remain direct.

**Data:** unread only; published_at descending; one query/cursor; visibility preserved; All/Unread untouched.

**Editorial:** maximum three Highlights; deterministic diversity; entry.id presentation dedupe; stable composition; correct loaded-only backfill; no ranking or personalization.

**Mutations:** read/unread/star reconcile correctly; stale sessions protected; reader origin/return correct.

**Visual:** image and text-only Primary; secondaries; Recent Grid; loading, empty and error states; light/dark; responsive matrix.

**Regression:** existing functional gates; code/test/build gates; dedicated Phase 2C harness.

**Deployment:** exact SHA and healthy runtime.

**Device:** 884x1104 passes; narrow mobile/Fold passes.

**Governance:** residual risks documented; no unrelated changes; explicit user merge authorization.

Only when all criteria pass is Phase 2C COMPLETED. Phase 2D may start only after Phase 2C is merged and closed.

## Implementation-plan decision points

The approved contract fixes product behavior but leaves the following implementation choices for the separate implementation-planning task. Resolve them explicitly before coding; do not use them to change the approved semantics:

1. **Route shape for a Home-origin reader:** choose a detail URL that preserves origin / for direct links, browser Back, close, and existing reader navigation, without changing other route semantics.
2. **Post-login preference migration:** define how existing per-server/user Home targets map to “Página após login”; the current NewsFlux deployment must resolve to Home (/), and explicit deep links must still win.
3. **Home request integration:** decide how to request unread, published_at descending, and existing visibility policy while bypassing All/Unread sort preferences and reusing the existing request/session guards.
4. **Ephemeral session holder:** select the smallest existing in-memory state boundary that retains highlightIds and scroll through a valid reader visit without creating a second article cache.
5. **Primary timestamp ties:** when multiple eligible entries share the newest published_at, use a stable entry.id tie-break; specify its ascending or descending direction.
6. **Stable ID tie-break direction:** specify ascending or descending entry.id for Secondary selection and backfill after all approved comparator dimensions tie.
7. **Missing metadata representation:** choose the technical representation for absent source or category metadata so the approved soft-preference comparator can operate without making diversity an eligibility requirement.
8. **Zero-unread versus empty loaded page representation:** select the repository-specific response/count and pagination signals that implement the specified distinction between a successful canonical zero-unread result and no currently loaded eligible entries while additional pages may exist. “Tudo em dia” remains limited to the successful global zero-unread result.
9. **Optimistic read mutation mechanics:** choose the in-memory pending-state mechanism that avoids committing removal/backfill until mutation success and restores the same projection on failure.
10. **Sentinel with empty Recent:** determine how the shared sentinel remains observable when Recent has no rendered rows but more server pages may exist, without changing Highlight stability.

## Prior work to preserve

- Phase 2B.2A OLED foundation;
- Phase 2B.2B Liquid Glass chrome;
- Phase 2B.2C editorial cards and read-state polish;
- upstream mutation hardening;
- Mark All Read to next unread feed/source behavior;
- deterministic All/Unread list behavior;
- Miniflux as source of truth.

This document is the approved design specification only. It does not authorize product implementation, an implementation plan, a pull request, deployment, or merge.
