# NewsFlux Phase 2C Editorial Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the root redirect with a deterministic, unread-first editorial Home that reuses the Miniflux article, reader, mutation, and pagination core.

**Architecture:** Keep the root Home mounted as the parent route while its /entry/:entryId child displays the existing reader layer. The Home owns only an ephemeral editorial projection of IDs and scroll/session metadata; contentState.entries remains the loaded article source. A pure selector ranks Highlights, while the existing request, stale-session, card-action, mutation, and pagination paths continue to own data and behavior.

**Tech Stack:** React 19.3 JSX, React Router 8.4, Nanostores, Vite 8.3, Arco Design, virtua, react-intersection-observer, SimpleBar/AdaptiveScrollArea, CSS, Node 22 native node:test, pnpm.

**Spec:** docs/superpowers/specs/2026-10-12-phase-2c-editorial-home-design.md

## Global Constraints

- Follow the approved specification without changing its product semantics.
- Keep / as the only Home route and use /entry/:entryId for Home-origin reader URLs. Preserve the existing /{list}/entry/:entryId routes for all other lists.
- Use the existing /v1/entries request and apiClient; Home fixes unread, published_at, descending order, and the current globally_visible policy. Do not create another endpoint, article cache, mutation system, or persistence mechanism.
- Use contentState.entries for loaded records. Store only ephemeral Home projection state: request/session key, highlightIds, and pending status transitions. Do not put article objects or editorial state in persistent settings.
- Preserve current Miniflux state/mutation semantics, identity/session revision guards, list routes, All/Unread ordering, Mark All Read behavior, reader actions, approved card/read-state styling, and Liquid Glass chrome.
- Home does not render Mark All Read, sort/date/status controls, or counts. Search remains available as a search-only global action and sends confirmed searches to the existing /all results route.
- Do not add dependencies. Use pure Node tests for deterministic logic and the Vite runtime harness for React/browser behavior; the repository has no React component test runner or DOM test dependency.
- Each implementation task starts with a failing test, implements only the bounded behavior, runs targeted and relevant regressions, then creates one focused commit. The plan branch itself contains only this plan document.
- No upstream sync, implementation PR, merge, deploy, or real-device execution is part of planning or implementation tasks. The exact-SHA deploy and real-device gates below are future pre-merge requirements.

## Review Focus

1. **Stale Home state after reader/navigation or identity/visibility change.** Test an old request, mutation settlement, and count response against a newer Home session in Tasks 2, 4, and 5.
2. **Pagination when Recent has no rows or the unread total changes.** Test one/two/three loaded entries, empty Recent, and total changes that toggle loadMoreVisible in Tasks 2, 5, and 7.
3. **False “Tudo em dia” from a short page, empty projection, or stale total.** Test total > 0 with empty/fully-highlighted rows against a confirmed canonical total === 0 in Tasks 2, 5, and 8.
4. **Read failure after optimistic UI state.** Test a pending read, rejected request, rollback, unchanged highlightIds, and unchanged total in Task 5.
5. **Deep-link, parent-param, and post-login routing collision.** Test explicit Home reader param forwarding, parent instance preservation, direct /entry/:entryId, explicit location.state.from, and migrated preference in Tasks 3 and 4.

## Repository Findings and Technical Decisions

1. **Home reader route:** Add / as a parent route with index and entry/:entryId children. The parent remains mounted across child navigation and owns the Home composition. HomePage explicitly matches `/entry/:entryId` with `useMatch` and passes `entryIdOverride` to Content; Content resolves that override first and falls back to its existing `useParams().entryId` for every list route. This avoids relying on descendant params being visible inside the parent. Normalize the root base path in src/utils/url.js so links are /entry/:entryId, not //entry/:id, and closing /entry/:id returns to /. Existing list-detail paths remain unchanged.
2. **Post-login preference:** Reuse settings.homePages and its per-server/user entries. Extend its view targets with home. Default and legacy all destinations migrate to home once using a migration marker within the existing homePages value; explicit saved today, starred, history, feed, and category targets remain post-login destinations. A user can select All again after migration. Keep the legacy homePage field only as an import/migration input. On login, an explicit location.state.from wins; only an authentication entry without an explicit destination consults the setting. This makes the current default resolve to / without adding storage.
3. **Canonical request:** Add getHomeEntries in src/apis/entries.js and share buildEntriesUrl/apiClient. Permit an explicit order direction in the common URL builder while preserving its current default for all existing callers. A Home request policy in useArticleList and useLoadMore fixes unread, published_at desc, no search/date, page size from existing settings, and globally_visible from showHiddenFeeds. Home request keys ignore mutable All/Unread sort/status and Home-irrelevant search/date state, but include page size, visibility, data-session revision, and article-list revision. Separate request generation from Home session identity: a refresh starts a new request but retains the last valid projection until success; identity, visibility, or canonical query changes invalidate it. This is one query shape and one cursor chain; pagination naturally makes subsequent requests with that same query.
4. **Ephemeral session holder:** Keep highlightIds, a canonical Home session key, the last successfully committed article-list snapshot revision, a scroll reference, and pending status overlay in local state owned by the mounted Home parent. The loaded contentState.entries remains the sole article collection. The Home parent route remains mounted while its reader child is active, so the same AdaptiveScrollArea and scroll position survive without storage or a duplicate global cache. Reinitialize the local projection when identity, visibility, page size, or data-session revision changes. An explicit refresh only replaces highlightIds after a successful response.
5. **Stable ID ties:** Use ascending numeric entry.id for Primary timestamp ties, Secondary final ties, and backfill final ties. Use the same final direction everywhere.
6. **Missing source/category:** Normalize absent/invalid metadata to null. A missing value is never eligible for a diversity win and is never treated as a novel synthetic source/category; it does not disqualify the entry. Continue to recency, image, then ascending ID.
7. **Global zero unread:** Use the successful canonical /v1/entries?status=unread... response total. Render “Tudo em dia” only when total === 0; entries.length === 0 or no projected Recent rows with total > 0 is not global zero.
8. **Pending read mechanics:** Extend the existing status mutation lifecycle with a small in-memory notification carrying entry IDs, prior/target status, outcome, and data-session revision. Home records the pending overlay before the existing optimistic contentState update, retains the prior editorial placement while pending, and applies read removal/backfill or mark-unread-to-Recent only on confirmed success. Rejection clears the overlay after the existing rollback and leaves the same projection. Ignore events from stale data sessions. No Miniflux mutation endpoint or mutation meaning changes.
9. **Empty Recent sentinel:** Extract the existing ArticleList observer/load-more UI into one shared LoadMoreSentinel component and keep useLoadMore as its owner of cursor/session checks. Render that sentinel once after the full Home composition, inside the same AdaptiveScrollArea, including when Recent is omitted. It uses the Home fixed request policy and cannot select or reorder Highlights.
10. **Root identity recovery:** HomePageManager is the single identity-failure owner for `/` and `/entry/:entryId`. Remove its root-path suppression, retain retry, and expose the existing logout recovery on Home routes while preserving the current path as the login return target. Home waits for identity readiness; HomeStates remains responsible for article-query loading and errors. Catalog failure does not block the canonical Home query because it does not depend on feed/category catalog data; catalog validation remains relevant only to saved feed/category post-login targets.

## File Structure

### CREATE

- src/utils/home-editorial-projection.js — pure initial selection, loaded-only backfill, and Recent projection functions.
- src/utils/home-editorial-projection.test.js — ranking, eligibility, diversity, dedupe, and stable-placement tests.
- src/utils/home-editorial-session.js — pure ephemeral projection transitions for pending/successful/failed status changes and session reset.
- src/utils/home-editorial-session.test.js — pending, rollback, backfill, unread insertion, star stability, and stale-session tests.
- src/utils/home-entry-request.js — pure construction of the fixed Home query parameters.
- src/utils/home-entry-request.test.js — canonical query, visibility, cursor, and no-search/date assertions.
- src/utils/article-list-request-key.test.js — Home request-key isolation and existing list-key regression tests.
- src/utils/home-page.test.js — Home/post-login target migration and destination precedence tests.
- src/utils/url.test.js — root and existing list detail URL/base-path tests.
- src/utils/entry-status-mutation-events.js — small ephemeral status-settlement subscription boundary used by the existing mutation helper and Home session.
- src/utils/entry-status-mutation-events.test.js — event ordering, success/failure payload, and session identity tests.
- src/pages/Home.jsx — root Home route parent, canonical entry adapter, and Content integration.
- src/components/Home/HomeEditorial.jsx — Home session owner and overall editorial composition.
- src/components/Home/HomeHighlights.jsx — ordered Primary and Secondary sections.
- src/components/Home/HomeHighlightCard.jsx — Home-only hierarchy wrapper over the existing ArticleEntry behavior.
- src/components/Home/HomeRecent.jsx — Recent Grid composition using ArticleEntry and ArticleGridCard.
- src/components/Home/HomeStates.jsx — Home loading, global empty, and initial/refresh error surfaces.
- src/components/Home/HomeEditorial.css — Home-only layout, responsive geometry, and theme-aware opaque surfaces.
- src/components/Article/LoadMoreSentinel.jsx — shared existing pagination observer and retry/loading UI.
- scripts/tests/phase2c-editorial-home.html — dedicated Vite visual/runtime harness page.
- scripts/tests/phase2c-editorial-home.jsx — fixture controls, browser scenarios, DOM gates, and result report.
- scripts/tests/phase2c-editorial-home.css — harness-only staging and viewport presentation.
- scripts/tests/fixtures/phase2c-editorial-home.js — deterministic article/source/category scenarios for the harness.
- scripts/tests/phase2c-list-regression.html — dedicated Vite entry for preserved All/Unread and Mark All Read regression scenarios.
- scripts/tests/phase2c-list-regression.jsx — runtime checks using production list/footer behavior and deterministic API responses.

### MODIFY

- src/routes.jsx — make / a Home parent with index and entry/:entryId children; retain every existing route.
- src/components/Content/Content.jsx — add the minimal custom list-content slot and Home request policy handoff; change the current `useParams().entryId` read (currently near line 71) to `entryIdOverride ?? routeEntryId` while retaining existing reader/detail lifecycle.
- src/components/HomePageManager.jsx — extend the existing `identityLoadState` notice/guard (currently near line 70) to own root Home identity failure, retry, and logout recovery.
- src/components/Content/ContentContext.jsx — use normalized root reader base paths and preserve existing focus restoration.
- src/components/Article/ArticleEntry.jsx — accept one optional presentation class so Home can style the existing interactive article wrapper without cloning its actions.
- src/utils/url.js — normalize / base path and root detail joining without changing other paths.
- src/apis/entries.js — use the shared request builder for a fixed Home query; leave existing endpoint paths and non-Home defaults intact.
- src/utils/article-list-request-key.js — isolate the Home request key from All/Unread controls and filters.
- src/utils/article-list-total-refresh.js — extend the existing `refreshTotal`/`isCurrentRequest` path (currently lines 18–104) to reconcile Home's canonical unread total after confirmed status mutations and update loadMoreVisible under the same query/session guards.
- src/hooks/useArticleList.js — fixed Home branch, Home response handling by ID-only presentation, and reuse of current stale/session guards.
- src/hooks/useLoadMore.js — fixed Home cursor/status/order branch and ID-only append for Home.
- src/components/Article/ArticleList.jsx — replace its inline load-more observer with the shared sentinel without changing ordinary list behavior.
- src/hooks/useEntryActions.js — publish status mutation intent/settlement events from the existing optimistic mutation path.
- src/components/Article/SearchAndSortBar.jsx — add search-only presentation and route confirmed Home searches to /all.
- src/components/Settings/General.jsx — relabel the existing preference as “Página após login” while retaining its setting control.
- src/components/Settings/HomePagePicker.jsx — add Home as a destination and keep existing view/feed/category targets available.
- src/hooks/useHomePage.js — expose Home/post-login label and path through the existing settings hook.
- src/store/homePageState.js — resolve the Home default and continue account-scoped preference/catalog validation.
- src/utils/home-page.js — extend target sanitization, default, legacy migration, and target paths.
- src/utils/settings-schema.js — extend the existing homePages shape with the one-time semantic migration marker; keep the legacy field for migration only.
- src/pages/Login.jsx — prefer explicit deep-link return state, otherwise navigate to the migrated post-login target.
- src/components/Sidebar/Sidebar.jsx — make the brand/Home action navigate to / regardless of the post-login preference.
- src/locales/de-DE.json — relabel preference and add Home destination text.
- src/locales/en-US.json — relabel preference and add Home destination text.
- src/locales/es-ES.json — relabel preference and add Home destination text.
- src/locales/fr-FR.json — relabel preference and add Home destination text.
- src/locales/ja-JP.json — relabel preference and add Home destination text.
- src/locales/zh-CN.json — relabel preference and add Home destination text.

### REMOVE

- src/components/HomeRedirect.jsx — root redirect is obsolete once / is the real Home; remove after the new route owns root behavior.
- src/components/HomeRedirect.css — its only consumer is HomeRedirect.jsx; remove with that component after the root route owns the state.

### TEST / HARNESS

- src/utils/home-editorial-projection.test.js
- src/utils/home-editorial-session.test.js
- src/utils/home-entry-request.test.js
- src/utils/article-list-request-key.test.js
- src/utils/home-page.test.js
- src/utils/url.test.js
- src/utils/entry-status-mutation-events.test.js
- scripts/tests/phase2c-editorial-home.html
- scripts/tests/phase2c-editorial-home.jsx
- scripts/tests/phase2c-editorial-home.css
- scripts/tests/fixtures/phase2c-editorial-home.js
- scripts/tests/phase2c-list-regression.html
- scripts/tests/phase2c-list-regression.jsx

## Implementation Tasks

### Task 1: Deterministic editorial projection

**Files:**
- Create: src/utils/home-editorial-projection.js
- Test: src/utils/home-editorial-projection.test.js

**Interfaces:**
- Consumes: prepared entries with id, status, published_at, optional feed, optional feed.category, and existing cover candidate fields.
- Produces: selectInitialHighlightIds(entries, { maxHighlights = 3 }), selectBackfillCandidate(recentEntries, survivingHighlights), and projectRecentEntries(entries, highlightIds); IDs are unique and Recent excludes every Highlight ID.

- [ ] **Step 1: Write the failing test**

In src/utils/home-editorial-projection.test.js, add tests named selects zero through three highlights from eligible unread entries, chooses newest primary with ascending id timestamp tie, applies source then category then recency then image then ascending id, keeps selection valid when source or category metadata is missing or shared, never uses image to choose primary or determine eligibility, deduplicates presentation by entry id only, projects no entry into both Highlights and Recent, and backfill preserves surviving slots and uses the same soft preferences.
Fixtures must include mixed read/unread records, equal timestamps, equal source/category groups, missing feed/category, image/no-image candidates, repeated IDs, and equal comparator values.

- [ ] **Step 2: Run the targeted test and verify failure**

Run:
~~~bash
node --test src/utils/home-editorial-projection.test.js
~~~

Expected: module-not-found or missing-export failures for the new selector interfaces.

- [ ] **Step 3: Implement the minimum behavior**

Implement only the pure comparator/projection. Primary is newest unread and uses ascending numeric ID only for timestamp ties. Secondary and backfill apply the approved source/category soft preferences in order, then recency, usable image as the late tie-break, then ascending ID. Normalize missing metadata to null; never let null count as diversity. Do not import React, stores, APIs, settings, or DOM.

- [ ] **Step 4: Re-run targeted test**

Run node --test src/utils/home-editorial-projection.test.js.

Expected: all projection tests PASS.

- [ ] **Step 5: Run relevant regression gates**

Run node --test src/utils/article-list-filters.test.js src/utils/reconcile-entries-after-mark-read.test.js.

Expected: existing filter and mark-read reconciliation behavior PASS unchanged.

- [ ] **Step 6: Commit**

~~~bash
git add src/utils/home-editorial-projection.js src/utils/home-editorial-projection.test.js
git commit -m "feat: add deterministic Home editorial projection"
~~~

### Task 2: Canonical Home query and shared request guards

**Files:**
- Create: src/utils/home-entry-request.js
- Create: src/utils/home-entry-request.test.js
- Create: src/utils/article-list-request-key.test.js
- Create: scripts/tests/phase2c-list-regression.html
- Create: scripts/tests/phase2c-list-regression.jsx
- Modify: src/apis/entries.js
- Modify: src/utils/article-list-request-key.js
- Modify: src/hooks/useArticleList.js
- Modify: src/hooks/useLoadMore.js

**Interfaces:**
- Consumes: current page size, showHiddenFeeds, dataState.sessionRevision, contentState.articleListRevision, and a Home cursor derived from loaded published_at.
- Produces: buildHomeEntryRequest({ pageSize, showHiddenFeeds, cursor }) and exported API adapter getHomeEntries({ pageSize, cursor } = {}); the adapter defaults pageSize to the existing setting and builds a count-only request with pageSize=1 and no cursor through the same helper. This shares status, order, direction, and visibility policy without creating a second editorial cursor. createArticleListRequestKey accepts optional sessionRevision and includes it in the Home request key. The canonical Home session key is created in Task 5 and omits articleListRevision so a pending refresh does not discard the visible projection. useArticleList/useLoadMore recognize only infoFrom/source === home as the fixed query policy. Existing callers keep their current signatures and behavior.

- [ ] **Step 1: Write the failing test**

Add request tests named builds unread published-at descending requests with inherited visibility, does not add Home search or date filters, preserves the single supplied cursor and page size, and uses the same query/visibility with pageSize=1 and no cursor for count reconciliation. Add request-key tests named Home key ignores All-Unread status and sort preferences, Home key changes for page size visibility data-session/article-list revision, and ordinary list keys still include their existing filters and sort settings. Task 5 tests that Home session identity stays stable when only explicit refresh generation changes. In scripts/tests/phase2c-list-regression.jsx, add runtime scenarios NO_ALL_RANKING, NO_UNREAD_RANKING, ALL_SORT_PREFERENCE_PRESERVED, and UNREAD_FILTER_PRESERVED using production list behavior and deterministic API responses.
Assert the exact Home query object: status unread, order published_at, direction desc, existing globally_visible semantics, no search/date, and no independent section cursor. Assert ordinary All/Unread requests keep their configured order and filter and are not reordered by Home projection.

- [ ] **Step 2: Run the targeted test and verify failure**

Run:
~~~bash
node --test src/utils/home-entry-request.test.js src/utils/article-list-request-key.test.js
~~~

Open scripts/tests/phase2c-list-regression.html.

Expected: missing Home request/key behavior and the four named All/Unread regression gates fail.

- [ ] **Step 3: Implement the minimum behavior**

Add Home request parameters through the existing /v1/entries builder and apiClient. Allow buildEntriesUrl an explicit direction, defaulting to the existing setting for every current caller. In useArticleList, bypass Home search/date/status controls, preserve request ID, mutation snapshot, and data-session guards, and store Home page records without title/hash/URL functional deduplication. Keep the Home session key separate from request generation. On a Home refresh failure, do not clear a previously committed Home entries/total snapshot; expose articleListError so Home can show a refresh error while retaining content. The Home component distinguishes initial failure from refresh failure using its own successfully committed snapshot revision. In useLoadMore, use the same unread/published_at-desc query and cursor; append Home pages by entry.id only. Keep All/Unread paths byte-for-byte equivalent where practical. Task 5 connects confirmed status settlement to the existing guarded total-refresh infrastructure using the count-only variant of the same Home request builder.

- [ ] **Step 4: Re-run targeted test**

Run node --test src/utils/home-entry-request.test.js src/utils/article-list-request-key.test.js.

Open scripts/tests/phase2c-list-regression.html.

Expected: canonical Home request/key tests and all four All/Unread preservation gates PASS.

- [ ] **Step 5: Run relevant regression gates**

Run node --test src/utils/article-list-filters.test.js src/utils/reconcile-entries-after-mark-read.test.js.

Rerun scripts/tests/phase2c-list-regression.html.

Expected: existing filtered-list request/reconciliation tests PASS; the runtime harness confirms All/Unread order and configured filters remain intact.

- [ ] **Step 6: Commit**

~~~bash
git add src/apis/entries.js src/utils/home-entry-request.js src/utils/home-entry-request.test.js src/utils/article-list-request-key.js src/utils/article-list-request-key.test.js src/hooks/useArticleList.js src/hooks/useLoadMore.js scripts/tests/phase2c-list-regression.html scripts/tests/phase2c-list-regression.jsx
git commit -m "feat: add canonical Home article request"
~~~

### Task 3: Post-login preference migration and destination choice

**Files:**
- Modify: src/utils/home-page.js
- Modify: src/store/homePageState.js
- Modify: src/utils/settings-schema.js
- Modify: src/hooks/useHomePage.js
- Modify: src/components/Settings/General.jsx
- Modify: src/components/Settings/HomePagePicker.jsx
- Modify: src/pages/Login.jsx
- Modify: all six locale files listed in File Structure
- Test: src/utils/home-page.test.js

**Interfaces:**
- Consumes: existing settings.homePages, legacy settings.homePage, authenticated server/user identity, and optional location.state.from.
- Produces: account-scoped { type: "view", id: "home" } target mapping to /, a one-time migration marker inside homePages, and getPostLoginPath({ homePages, identity, legacyHomePage, explicitFrom }).

- [ ] **Step 1: Write the failing test**

Add tests named defaults new identities to Home, migrates legacy All destination to Home once, preserves explicit legacy destinations for Today Starred History Feed and Category, allows selecting All as a post-login destination after migration, uses the destination for the matching server and user only, and explicit deep-link from state wins over the saved preference.
Include two identities on different servers and a saved /feed/:id preference.

- [ ] **Step 2: Run the targeted test and verify failure**

Run node --test src/utils/home-page.test.js.

Expected: missing Home target/path/post-login helper and migration assertions fail.

- [ ] **Step 3: Implement the minimum behavior**

Add home to the per-identity view target vocabulary and default; preserve the legacy homePage schema only for migration/import. Use the existing persisted homePages setting with a one-time marker; map the legacy default All value to Home and retain saved non-default destinations. After migration, the picker may store All as a deliberate login destination. In Login, use explicit location.state.from first; otherwise resolve the target for the identity returned by the successful login. Relabel the setting “Página após login” and provide localized Home/All labels in all shipped locales.

- [ ] **Step 4: Re-run targeted test**

Run node --test src/utils/home-page.test.js.

Expected: target isolation, migration, and explicit deep-link precedence PASS.

- [ ] **Step 5: Run relevant regression gates**

Run pnpm exec prettier --check on the changed JS/JSX/JSON files and pnpm exec eslint on the changed JS/JSX files.

Expected: formatting and lint PASS; preference persistence remains under the existing settings key.

- [ ] **Step 6: Commit**

~~~bash
git add src/utils/home-page.js src/utils/home-page.test.js src/store/homePageState.js src/utils/settings-schema.js src/hooks/useHomePage.js src/components/Settings/General.jsx src/components/Settings/HomePagePicker.jsx src/pages/Login.jsx src/locales
git commit -m "feat: repurpose home target as post-login preference"
~~~

### Task 4: Root Home route and mounted reader integration

**Files:**
- Create: src/pages/Home.jsx
- Create: src/components/Home/HomeEditorial.jsx
- Create: scripts/tests/phase2c-editorial-home.html
- Create: scripts/tests/phase2c-editorial-home.jsx
- Create: scripts/tests/phase2c-editorial-home.css
- Create: scripts/tests/fixtures/phase2c-editorial-home.js
- Modify: src/routes.jsx
- Modify: src/components/Content/Content.jsx
- Modify: src/components/HomePageManager.jsx
- Modify: src/components/Content/ContentContext.jsx
- Modify: src/utils/url.js
- Modify: src/components/Sidebar/Sidebar.jsx
- Remove: src/components/HomeRedirect.jsx
- Remove: src/components/HomeRedirect.css (the confirmed sole consumer is HomeRedirect.jsx)
- Test: src/utils/url.test.js
- Harness: scripts/tests/phase2c-editorial-home.jsx (route scenario)

**Interfaces:**
- Consumes: Content current getEntries, info, activeContent, route params, reader refs, and a new listContent slot.
- Produces: / parent Home route with / index and /entry/:entryId child. HomePage calls useMatch("/entry/:entryId") and passes `entryIdOverride={match?.params.entryId}` to Content. Content resolves `entryIdOverride ?? useParams().entryId`, preserving route-param behavior for /all, feed, category, and other existing routes. The same Home parent/session instance stays mounted through / → /entry/101 → /. HomePageManager owns root Home identity failure recovery; Home waits during identity loading, the manager keeps retry and logout available on / and root detail URLs, and it preserves the current path for login return. HomeStates owns article-query failures separately. Catalog errors do not block Home's canonical query, which does not require feed/category catalog data. Root Home action always navigates to /.

- [ ] **Step 1: Write the failing test**

Add URL tests named builds root reader links as slash-entry-id, extracts slash as the root return path, keeps all feed category and view detail paths unchanged, and closes a root detail route back to slash. Add harness checks named HOME_ROUTE_ROOT_AND_READER_RETURN, HOME_READER_PARAM_BRIDGE, HOME_PARENT_MOUNT_PRESERVATION, HOME_LOGO_ROOT, and HOME_IDENTITY_FAILURE_RECOVERY. Verify useMatch forwards 101 into Content; the Home session component instance token is unchanged through / → /entry/101 → /; browser Back/Forward and direct /entry/202 preserve URL-driven reader behavior; identity failure exposes retry and logout without navigating away from a direct link; and a Home article-query error remains a separate state.

- [ ] **Step 2: Run the targeted test and verify failure**

Run node --test src/utils/url.test.js.

Open the route scenario in scripts/tests/phase2c-editorial-home.html.

Expected: root joining/return assertions and HOME_READER_PARAM_BRIDGE/HOME_PARENT_MOUNT_PRESERVATION fail against the current route wiring.

- [ ] **Step 3: Implement the minimum behavior**

Make the root route a mounted parent that renders Content with info.from=home and a Home list-content slot. HomePage uses `useMatch("/entry/:entryId")` as the explicit route-param bridge and passes `entryIdOverride` to Content; Content falls back to its current `useParams()` value when that prop is absent. Add a parent-instance runtime assertion for / → /entry/101 → /. Create HomeEditorial as a compilable composition placeholder for this routing task; later tasks add session, sections, states, and styling. Add index and entry/:entryId children so changing only the child URL preserves the Home component, its scroll root, and local session. Keep Content responsible for URL-driven article fetching, full-size reader, Back/Forward, focus restore, swipe, and previous/next. Normalize root path joining/closing in url.js and ContentContext. Keep the existing /all, /today, /starred, /history, feed/category, and their detail routes. Retire HomeRedirect and its CSS; repository search confirms HomeRedirect.css has no other consumer. Extend HomePageManager's existing identity failure branch to include `/` and `/entry/:entryId`, preserving retry and adding the existing logout recovery with `clearSession`; logout returns to `/login` with the current Home pathname in `location.state.from`. The Home route shows the existing identity loading state until identity has a snapshot; on identity error it leaves recovery to HomePageManager and does not start the Home query. HomeStates handles only article-query loading/error/empty states. A Home article-query error remains distinct from identity failure and the manager does not redirect or replace a direct `/entry/:entryId` URL. Do not make catalog failure block Home's canonical query; catalog validation remains only for saved feed/category destinations. The brand/Home button goes to /. Do not place ranking, cards, skeletons, or Home layout in Content.

- [ ] **Step 4: Re-run targeted test**

Run node --test src/utils/url.test.js.

Expected: root and all existing list-detail URL tests PASS.

- [ ] **Step 5: Run relevant regression gates**

Run pnpm run lint, pnpm run format:check, and pnpm run build; open the route scenario in the Phase 2C harness and verify HOME_ROUTE_ROOT_AND_READER_RETURN.

Expected: all existing routes build; Content receives the explicit Home child ID; the same Home parent stays mounted through reader open/close and browser history; HOME_IDENTITY_FAILURE_RECOVERY passes for root and direct root-detail URLs.

- [ ] **Step 6: Commit**

~~~bash
git add src/pages/Home.jsx src/components/Home/HomeEditorial.jsx src/routes.jsx src/components/Content/Content.jsx src/components/Content/ContentContext.jsx src/components/HomePageManager.jsx src/utils/url.js src/utils/url.test.js src/components/Sidebar/Sidebar.jsx src/components/HomeRedirect.jsx src/components/HomeRedirect.css scripts/tests/phase2c-editorial-home.html scripts/tests/phase2c-editorial-home.jsx scripts/tests/phase2c-editorial-home.css scripts/tests/fixtures/phase2c-editorial-home.js
git commit -m "feat: route root to editorial Home"
~~~

### Task 5: Stable Home session and confirmed mutation projection

**Files:**
- Create: src/utils/home-editorial-session.js
- Create: src/utils/home-editorial-session.test.js
- Create: src/utils/entry-status-mutation-events.js
- Create: src/utils/entry-status-mutation-events.test.js
- Modify: src/hooks/useEntryActions.js
- Modify: src/utils/article-list-total-refresh.js
- Modify: src/components/Content/ContentContext.jsx
- Modify: src/components/Home/HomeEditorial.jsx
- Modify: scripts/tests/phase2c-editorial-home.jsx
- Modify: scripts/tests/phase2c-list-regression.jsx

**Interfaces:**
- Consumes: existing status mutation calls for card actions, mark-read-on-view, mark-read-on-scroll, and ArticleDetail; existing getDataSessionRevision; projection selectors from Task 1.
- Produces: an ephemeral Home session { requestKey, sessionRevision, highlightIds, scrollRoot, pendingStatusById } and status events { entryIds, previousStatuses, targetStatus, outcome, sessionRevision }. `subscribeArticleListTotalRefresh` consumes those settlement events and only on confirmed Home read/unread schedules `getHomeEntries({ pageSize: 1 })` after mutation idle. Its canonical count response updates both contentState.total and loadMoreVisible under the active query/session/snapshot guards. Failed mutations leave the last valid total and pagination visibility intact. Entries continue to come from contentState.entries.

- [ ] **Step 1: Write the failing test**

Add tests named home session key ignores refresh generation, keeps placement while a read is pending, commits exactly one slot backfill only after confirmed read, failed read retains the same projection after rollback, confirmed mark-unread inserts an already-loaded entry only into Recent, unloaded mark-unread does not add an article object or trigger an entry fetch, star changes never alter highlight ids, session identity or visibility change discards old highlights, and stale status settlement cannot mutate the current Home session. Add event tests named publishes intent before optimistic store change, publishes confirmed success and rejection with entry ids, and ignores settlement from an obsolete data session. In the Phase 2C runtime harness add HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA (initial total=1; confirmed read; guarded canonical count=0), HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL (rejected mutation leaves total=1 and no zero state), HOME_MARK_UNREAD_RECONCILES_TOTAL (confirmed unread refreshes total), HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION (loaded unread IDs remain unchanged; canonical total grows past the loaded eligible universe; loadMoreVisible becomes true without an entry-specific fetch), and HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED (deferred count response after session change cannot commit total or visibility). Task 2's home-entry-request.test.js owns HOME_TOTAL_VISIBILITY_POLICY_MATCHES_QUERY by comparing page and count query visibility under both showHiddenFeeds values. Extend the focused list regression harness with the existing Mark All Read gates, using its real FooterPanel and deterministic API responses.
Exercise Primary and Secondary vacancies separately, a candidate absent from the loaded Recent set, repeated status toggles, and failure after an optimistic content status update.

- [ ] **Step 2: Run the targeted test and verify failure**

Run node --test src/utils/home-editorial-session.test.js src/utils/entry-status-mutation-events.test.js.

Expected: missing session transition and event interfaces fail; the named Home total and Mark All Read runtime scenarios fail before wiring is added.

- [ ] **Step 3: Implement the minimum behavior**

Keep projection state local to the mounted Home parent. Define createHomeSessionKey({ identityKey, showHiddenFeeds, pageSize, sessionRevision }); exclude articleListRevision so a refresh does not discard the valid projection before it succeeds. Subscribe the session to an event emitted by the existing useEntryActions status mutation path before the current optimistic state update and when each request batch settles. On confirmed read, remove only that ID and use Task 1 loaded-only backfill; on rejection, retain the projection and clear pending state after the existing rollback; on confirmed unread, insert an entry into Recent by published_at descending only when its record is already in contentState.entries, without changing Highlights. If the record is unloaded, do not add an article object or issue an entry fetch; let canonical total reconciliation expose the shared sentinel. Star events do not touch the projection. Subscribe the existing article-list total refresh path to status settlement outcomes; only a confirmed Home read/unread event schedules reconciliation after mutation idle, using `getHomeEntries({ pageSize: 1 })` from Task 2. Commit total and loadMoreVisible together only for the active request/session/snapshot, using unique loaded unread IDs as the loaded eligible count. A failed status mutation schedules no Home total commit; a failed count request preserves the prior total and pagination state. Reset on canonical session identity/visibility/page-size/data-session change. An explicit refresh retains the previous projection while pending and replaces it only after success. Do not alter API mutations, status/count semantics, or persist this state.

- [ ] **Step 4: Re-run targeted test**

Run node --test src/utils/home-editorial-session.test.js src/utils/entry-status-mutation-events.test.js.

Expected: all success, pending, failure, stale-session, and star-stability tests PASS.

- [ ] **Step 5: Run relevant regression gates**

Run node --test src/utils/reconcile-entries-after-mark-read.test.js src/utils/article-list-filters.test.js; use scripts/tests/phase2c-editorial-home.html to exercise the six named Home total gates plus read-on-view, card status action, reader status action, and mark-read-on-scroll; use scripts/tests/phase2c-list-regression.html for the named Mark All Read behavior gates.

Expected: existing reconciliation remains unchanged; Home total/visibility only commit from successful current canonical count responses; all Home status sources update the same projection contract; the existing Mark All Read gates are owned and passing in the focused list harness.

- [ ] **Step 6: Commit**

~~~bash
git add src/utils/home-editorial-session.js src/utils/home-editorial-session.test.js src/utils/entry-status-mutation-events.js src/utils/entry-status-mutation-events.test.js src/hooks/useEntryActions.js src/utils/article-list-total-refresh.js src/components/Content/ContentContext.jsx src/components/Home/HomeEditorial.jsx scripts/tests/phase2c-editorial-home.jsx scripts/tests/phase2c-list-regression.jsx
git commit -m "feat: reconcile Home projection after status mutations"
~~~

### Task 6: Highlights and behavior-preserving card reuse

**Files:**
- Create: src/components/Home/HomeHighlights.jsx
- Create: src/components/Home/HomeHighlightCard.jsx
- Modify: src/components/Home/HomeEditorial.jsx
- Modify: src/components/Article/ArticleEntry.jsx
- Modify: scripts/tests/phase2c-editorial-home.html
- Modify: scripts/tests/phase2c-editorial-home.jsx
- Modify: scripts/tests/phase2c-editorial-home.css
- Modify: scripts/tests/fixtures/phase2c-editorial-home.js

**Interfaces:**
- Consumes: Task 1 highlightIds, contentState.entries, existing ArticleEntry, useArticleCardActivation, useReadOnScroll, image/deck fields from prepareEntry.
- Produces: DOM order Primary, Secondary 1, Secondary 2; at most three ArticleEntry instances with existing open/read/star/menu behavior. Primary can render intentional text-only content without media placeholder or reserved empty image space.

- [ ] **Step 1: Write the failing test**

Add harness checks named HOME_PRIMARY_NEWEST, HOME_MAX_THREE_HIGHLIGHTS, HOME_PRIMARY_TEXT_ONLY, HOME_SECONDARIES_BALANCED_ORDER, HOME_HIGHLIGHT_ACTIONS, and HOME_DEDUPE_BY_ENTRY_ID. Fixtures cover image Primary, text-only Primary, two Highlights, one Highlight, shared source/category, and cards with different actions/statuses.

- [ ] **Step 2: Run the targeted test and verify failure**

Run pnpm run dev -- --host 127.0.0.1, open http://127.0.0.1:5173/scripts/tests/phase2c-editorial-home.html, choose the Highlights scenario, and verify the named gates fail before the components exist.

Expected: missing Home sections or failed hierarchy/action assertions.

- [ ] **Step 3: Implement the minimum behavior**

Create the Highlight composition and a small Home presenter wrapper. Add one optional presentation class to ArticleEntry, leaving its default output unchanged. Reuse ArticleEntry for primary activation, selected/focus state, read/unread, star, compatible menu actions, and read-on-scroll; use the existing ArticleGridCard presenter for image, deck, and metadata behavior. Do not clone ArticleGridCard or change normal Grid styles or the reader.

- [ ] **Step 4: Re-run targeted test**

Reload the harness and run the Highlight scenario.

Expected: all Task 6 gates PASS; Primary does not change based on image availability.

- [ ] **Step 5: Run relevant regression gates**

Open scripts/tests/phase2b2c01-rounded-editorial-cards.html and scripts/tests/phase2b2c01-viewport-matrix.html; verify normal Grid surfaces, read/unread presentation, selected/focus, and card actions still pass.

Expected: approved Phase 2B.2C card/read-state behavior remains intact.

- [ ] **Step 6: Commit**

~~~bash
git add src/components/Home/HomeHighlights.jsx src/components/Home/HomeHighlightCard.jsx src/components/Home/HomeEditorial.jsx src/components/Article/ArticleEntry.jsx scripts/tests/phase2c-editorial-home.html scripts/tests/phase2c-editorial-home.jsx scripts/tests/phase2c-editorial-home.css scripts/tests/fixtures/phase2c-editorial-home.js
git commit -m "feat: add editorial Home Highlights"
~~~

### Task 7: Recent Grid and one shared pagination sentinel

**Files:**
- Create: src/components/Home/HomeRecent.jsx
- Create: src/components/Article/LoadMoreSentinel.jsx
- Modify: src/components/Article/ArticleList.jsx
- Modify: src/components/Home/HomeEditorial.jsx
- Modify: scripts/tests/phase2c-editorial-home.jsx
- Modify: scripts/tests/fixtures/phase2c-editorial-home.js

**Interfaces:**
- Consumes: loaded Home entries, projectRecentEntries, loadMoreVisible, Task 2 Home request adapter, existing ArticleGridCard, and one AdaptiveScrollArea scroll root.
- Produces: Recent in canonical published_at descending order with entry-ID exclusion from Highlights, plus one shared sentinel after Highlights and Recent whether or not Recent has rows.

- [ ] **Step 1: Write the failing test**

Add harness checks named HOME_RECENT_GRID, HOME_DEDUPE_BY_ENTRY_ID, HOME_LOAD_MORE_STABLE, HOME_ONE_CURSOR, HOME_EMPTY_RECENT_SENTINEL, HOME_NO_EXTRA_HIGHLIGHT_FETCH, and HOME_LARGE_PAGE_APPEND. Start with 3, 20, and 250 loaded entries; set the first three as Highlights and confirm one sentinel and no repeated IDs. For the empty Recent case, set one/two loaded records and a positive total with more pages.

- [ ] **Step 2: Run the targeted test and verify failure**

Run the Home Recent/pagination scenario in the Vite harness.

Expected: no Recent composition/shared sentinel exists; HOME_EMPTY_RECENT_SENTINEL and one-cursor assertions fail.

- [ ] **Step 3: Implement the minimum behavior**

Extract the current LoadMoreComponent observer/retry/loading UI into LoadMoreSentinel, preserving its in-view arming and root visibility logic. Use it from existing ArticleList and Home so there remains one implementation. Home places exactly one sentinel after the whole composition within its persistent AdaptiveScrollArea. useLoadMore uses the Home cursor, waits for existing mutations, checks the current data session/request snapshot, ID-appends new records to Recent, and never recomputes Highlight IDs.

- [ ] **Step 4: Re-run targeted test**

Run the Home Recent/pagination harness scenario.

Expected: one sentinel, one cursor sequence, no duplicate IDs, and stable Highlights PASS with Recent empty or populated.

- [ ] **Step 5: Run relevant regression gates**

Run the existing scripts/tests/phase2b-card-layout-runtime.html scenario and node --test src/utils/home-editorial-projection.test.js src/utils/home-editorial-session.test.js.

Expected: current list virtualization/load-more behavior remains intact; Home append preserves projection.

- [ ] **Step 6: Commit**

~~~bash
git add src/components/Home/HomeRecent.jsx src/components/Article/LoadMoreSentinel.jsx src/components/Article/ArticleList.jsx src/components/Home/HomeEditorial.jsx scripts/tests/phase2c-editorial-home.jsx scripts/tests/fixtures/phase2c-editorial-home.js
git commit -m "feat: reuse one pagination sentinel for Home"
~~~

### Task 8: Loading, low-count, empty, and error states

**Files:**
- Create: src/components/Home/HomeStates.jsx
- Modify: src/components/Home/HomeEditorial.jsx
- Modify: src/hooks/useArticleList.js
- Modify: scripts/tests/phase2c-editorial-home.jsx
- Modify: scripts/tests/fixtures/phase2c-editorial-home.js

**Interfaces:**
- Consumes: isArticleListReady, articleListError, loadMoreError, total, loaded entries, explicit refresh lifecycle, and the canonical request key.
- Produces: Home-specific initial skeleton/error/zero-unread states; optional Highlights for one/two entries; omitted Recent heading/container/message when Recent is empty; retained valid projection on failed explicit refresh; local retry at the shared sentinel for load-more failure. `total === 0` is usable only from a successful current canonical Home response or completed count reconciliation; identity recovery remains owned by HomePageManager, not the article-query error surface.

- [ ] **Step 1: Write the failing test**

Add harness checks named HOME_LOADING, HOME_LOW_UNREAD_COUNTS, HOME_EMPTY_RECENT, HOME_ZERO_UNREAD, HOME_INITIAL_ERROR, HOME_REFRESH_ERROR_PRESERVES_CONTENT, and HOME_LOAD_MORE_ERROR. Include entries=[]/successful total=0, entries=[]/total=12, one/two loaded entries, an initial rejection, a refresh rejection with valid old content, and a load-more rejection. Assert a failed mutation/count reconciliation cannot produce HOME_ZERO_UNREAD; Task 5 owns the success/failure transition cases.

- [ ] **Step 2: Run the targeted test and verify failure**

Run the state scenario in the Vite harness.

Expected: missing Home-specific states fail; the total=12 case must specifically fail if it is incorrectly rendered as “Tudo em dia.”

- [ ] **Step 3: Implement the minimum behavior**

Show the “Tudo em dia” state only after a successful current canonical response or guarded count reconciliation with total === 0. Do not infer global emptiness from projected rows or a short/empty page. Keep identity failure (HomePageManager), initial article-query failure, refresh failure, and zero-unread distinct. During explicit refresh, retain the last valid session/projection until success; on failure, show refresh error plus retry in the Home surface. Keep load-more retry local to the shared sentinel. Render only the loaded Highlight count and omit empty Recent entirely.

- [ ] **Step 4: Re-run targeted test**

Run the Home state scenario in the Vite harness.

Expected: all low-count, zero, initial error, refresh retention, and load-more error gates PASS.

- [ ] **Step 5: Run relevant regression gates**

Run node --test src/utils/home-editorial-session.test.js src/utils/home-entry-request.test.js; manually repeat Home refresh twice and verify only one active request/cursor chain remains.

Expected: projection is replaced only after a successful explicit refresh, and stale responses cannot replace newer Home content.

- [ ] **Step 6: Commit**

~~~bash
git add src/components/Home/HomeStates.jsx src/components/Home/HomeEditorial.jsx scripts/tests/phase2c-editorial-home.jsx scripts/tests/fixtures/phase2c-editorial-home.js
git commit -m "feat: add Home loading and recovery states"
~~~

### Task 9: Responsive editorial composition, search-only action, and themes

**Files:**
- Create: src/components/Home/HomeEditorial.css
- Modify: src/components/Home/HomeEditorial.jsx
- Modify: src/components/Home/HomeHighlights.jsx
- Modify: src/components/Home/HomeRecent.jsx
- Modify: src/components/Content/Content.jsx
- Modify: src/components/Article/SearchAndSortBar.jsx
- Modify: scripts/tests/phase2c-editorial-home.jsx
- Modify: scripts/tests/phase2c-editorial-home.css

**Interfaces:**
- Consumes: Home sections and existing Grid maximum-column behavior, SearchAndSortBar, current CSS tokens, and the fixed viewport/theme matrix.
- Produces: mobile/Fold single-column order, 884×1104 Primary full module width + two Secondary/Recent columns, desktop Recent using existing maximum columns, search-only global action routed to /all, and light/dark opaque content surfaces.

- [ ] **Step 1: Write the failing test**

Add responsive harness checks named HOME_NO_OVERFLOW, HOME_SECTION_HIERARCHY, HOME_SECONDARY_LAYOUT, HOME_RECENT_GRID, HOME_SEARCH_ONLY, HOME_SEARCH_ROUTES_TO_ALL, HOME_LIGHT, and HOME_DARK. Capture every required viewport and check computed card columns, widths, section order, no visible sort/date/status controls on Home, opaque content surfaces, and glass-only chrome.

- [ ] **Step 2: Run the targeted test and verify failure**

Run the responsive harness at 390×844, 768×1024, 884×1104, 1024×768, 1280×800, and 1440×900 in light and dark/OLED.

Expected: Home layout and search-only gates fail before Home-specific styles/slot behavior are added.

- [ ] **Step 3: Implement the minimum behavior**

Add Home-only CSS with semantic section headings, readable density, Primary dominance without gigantism, two Secondary columns at sufficient width, one-column narrow layout, and Recent using existing card styles/maximum columns. Keep surfaces opaque and use existing theme tokens. Add a Search-only mode to the current SearchAndSortBar that omits date/sort controls; on Home, confirming search sets the existing query and navigates to /all. Do not create a new search state or change regular list-bar behavior.

- [ ] **Step 4: Re-run targeted test**

Run all viewport/theme cases in the Home harness.

Expected: responsive, search-only, hierarchy, no-overflow, and light/dark gates PASS; at 1024×768 Recent is recognizable as the next section.

- [ ] **Step 5: Run relevant regression gates**

Open the existing Phase 2B.2A/2B.2B/2B.2C harness pages and verify OLED canvas, approved Liquid Glass controls, card opacity/radius, read state, and normal Search/Date/Sort appearance.

Expected: Home-only styling does not recalibrate chrome or change existing list card visuals.

- [ ] **Step 6: Commit**

~~~bash
git add src/components/Home/HomeEditorial.css src/components/Home/HomeEditorial.jsx src/components/Home/HomeHighlights.jsx src/components/Home/HomeRecent.jsx src/components/Content/Content.jsx src/components/Article/SearchAndSortBar.jsx scripts/tests/phase2c-editorial-home.jsx scripts/tests/phase2c-editorial-home.css
git commit -m "feat: style responsive editorial Home"
~~~

### Task 10: Complete the dedicated Phase 2C visual/runtime harness

**Files:**
- Modify: scripts/tests/phase2c-editorial-home.html
- Modify: scripts/tests/phase2c-editorial-home.jsx
- Modify: scripts/tests/phase2c-editorial-home.css
- Modify: scripts/tests/fixtures/phase2c-editorial-home.js

**Interfaces:**
- Consumes: real Home components/styles, deterministic fixture scenarios, and the exact six viewport sizes/two themes.
- Produces: browser-visible gate report for all visual/runtime states, Home identity recovery and total reconciliation scenarios, scenario reset controls, and captured dimensions/DOM counts; no production code path or live Miniflux/network dependency.

- [ ] **Step 1: Write the failing test**

Add a harness completeness assertion named HARNESS_SCENARIO_MATRIX_COMPLETE that requires every viewport, theme, gate, and scenario listed in Visual Harness and Device Validation. Also assert the gate names HOME_NO_OVERFLOW, HOME_SECTION_HIERARCHY, HOME_PRIMARY_TEXT_ONLY, HOME_SECONDARY_LAYOUT, HOME_RECENT_GRID, HOME_EMPTY_RECENT, HOME_LOADING, HOME_REFRESH_ERROR_WITH_CONTENT, HOME_LIGHT, HOME_DARK, HOME_IDENTITY_FAILURE_RECOVERY, HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA, HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL, HOME_MARK_UNREAD_RECONCILES_TOTAL, HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION, and HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED.

- [ ] **Step 2: Run the targeted test and verify failure**

Run pnpm run dev -- --host 127.0.0.1 and open http://127.0.0.1:5173/scripts/tests/phase2c-editorial-home.html.

Expected: HARNESS_SCENARIO_MATRIX_COMPLETE fails with missing viewport/theme/scenario/gate names; no live Miniflux/network access is required.

- [ ] **Step 3: Implement the minimum behavior**

Finish the standalone Vite harness using deterministic fixtures, mocked API/count responses, and the actual production Home components/styles. Add every required viewport, theme, product state, root identity failure/retry/logout, and canonical total settlement case. Each scenario must reset fixture/session state; the report must distinguish automated DOM/computed-style/state-transition checks from perceptual checks. Do not add production test hooks that alter runtime behavior.

- [ ] **Step 4: Re-run targeted test**

Run the harness across all six viewports, both themes, and every listed scenario.

Expected: every automatable Home gate, including identity recovery and stale-safe total/load-more reconciliation, PASS; any manual perceptual gate is explicitly marked MANUAL_REQUIRED, never silently counted as pass.

- [ ] **Step 5: Run relevant regression gates**

Open scripts/tests/phase2b2c01-rounded-editorial-cards.html, scripts/tests/phase2b2c01-viewport-matrix.html, and scripts/tests/phase2b1-entry-presentation.html.

Expected: approved Phase 2B.2C card/read-state and image/excerpt contracts remain intact.

- [ ] **Step 6: Commit**

~~~bash
git add scripts/tests/phase2c-editorial-home.html scripts/tests/phase2c-editorial-home.jsx scripts/tests/phase2c-editorial-home.css scripts/tests/fixtures/phase2c-editorial-home.js
git commit -m "test: add Phase 2C editorial Home harness"
~~~

### Task 11: Final regression orchestration and implementation branch verification

**Files:**
- Modify: scripts/tests/phase2c-list-regression.jsx (gate registry/report only; behavior scenarios are owned by Tasks 2 and 5)
- Test: all new pure tests, the Phase 2C Home harness, and the focused list regression harness
- Harness: existing Phase 2B.2C card/read-state harnesses

**Interfaces:**
- Consumes: named gates and exact owners from the Existing List Regression Ownership table, plus Home gates introduced in Tasks 2–10.
- Produces: one explicit regression matrix report; no miscellaneous product behavior assertions and no production changes.

- [ ] **Step 1: Write the failing suite-completeness assertion**

Add LIST_REGRESSION_MATRIX_COMPLETE to scripts/tests/phase2c-list-regression.jsx. It asserts that each gate owned by this harness is registered under its exact name and that the existing helper-level suites are listed separately for their narrower coverage. It must not implement or duplicate the behavior assertions owned by Tasks 2 and 5.

- [ ] **Step 2: Run the targeted test and verify failure**

Open scripts/tests/phase2c-list-regression.html.

Expected: LIST_REGRESSION_MATRIX_COMPLETE fails for any missing named scenario or mismatched test owner.

- [ ] **Step 3: Implement the minimum behavior**

Add only the matrix completeness/report wiring. If a behavior scenario is missing or fails, return to its owning task and fix it there in a focused commit. Preserve the existing Phase 2B.2C card/read-state harness checks. Do not change API contracts, authentication, Miniflux mutation semantics, All/Unread ranking, reader design, normal Grid design, or unrelated Content/FooterPanel behavior.

- [ ] **Step 4: Re-run targeted test**

Run node --test src/utils/*.test.js, scripts/tests/phase2c-editorial-home.html, scripts/tests/phase2c-list-regression.html, and the existing Phase 2B.2C harnesses.

Expected: every pure test and automatable functional/regression gate reports PASS under its named owner; manual device gates remain explicitly MANUAL_REQUIRED.

- [ ] **Step 5: Run relevant regression gates**

Run pnpm run lint, pnpm run format:check, pnpm run build, pnpm run test:fonts, node --test src/utils/*.test.js, and git diff --check.

Expected: all repository code gates PASS and the Phase 2B.2C design contract remains intact.

- [ ] **Step 6: Commit**

~~~bash
git add scripts/tests/phase2c-list-regression.jsx
git commit -m "test: verify Phase 2C regression matrix ownership"
~~~

## Gate-to-Task Map

| Gate | Owning task(s) |
| --- | --- |
| HOME_ROUTE_ROOT, HOME_LOGO_ROOT, HOME_POST_LOGIN_PREFERENCE, HOME_DEEP_LINK_NOT_INTERCEPTED, HOME_READER_PARAM_BRIDGE, HOME_PARENT_MOUNT_PRESERVATION, HOME_IDENTITY_FAILURE_RECOVERY | 3–4, 10 |
| HOME_UNREAD_ONLY, HOME_PUBLISHED_AT_DESC, HOME_FEED_VISIBILITY_INHERITED, HOME_ONE_QUERY, HOME_ONE_CURSOR | 2, 7, 11 |
| HOME_MAX_THREE_HIGHLIGHTS, HOME_PRIMARY_NEWEST, HOME_SECONDARY_SOURCE_DIVERSITY, HOME_SECONDARY_CATEGORY_DIVERSITY, HOME_IMAGE_ONLY_TIEBREAK, HOME_DEDUPE_BY_ENTRY_ID, HOME_NO_EXTRA_HIGHLIGHT_FETCH | 1, 6–7 |
| HOME_LOAD_MORE_STABLE, HOME_REFRESH_RECOMPOSES | 2, 5, 7–8 |
| HOME_READ_SUCCESS_REMOVES, HOME_READ_BACKFILL, HOME_READ_FAILURE_RECONCILES, HOME_MARK_UNREAD_RECENT, HOME_STAR_POSITION_STABLE | 5, 6, 11 |
| HOME_READER_ORIGIN, HOME_READER_RETURN, HOME_SCROLL_RESTORE | 4–5 |
| HOME_ZERO_UNREAD, HOME_INITIAL_ERROR, HOME_REFRESH_ERROR_PRESERVES_CONTENT, HOME_LOAD_MORE_ERROR | 2, 8 |
| HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA, HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL, HOME_MARK_UNREAD_RECONCILES_TOTAL, HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION, HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED | 2 (canonical query), 5 (settlement/reconciliation), 8 (zero state), 10 (harness matrix) |
| HOME_TOTAL_VISIBILITY_POLICY_MATCHES_QUERY | 2 (`home-entry-request.test.js`) |
| NO_ALL_RANKING, NO_UNREAD_RANKING, ALL_SORT_PREFERENCE_PRESERVED, UNREAD_FILTER_PRESERVED | 2, 11 (`phase2c-list-regression.jsx`; key assertions in `article-list-request-key.test.js`) |
| MARK_ALL_READ_SUCCESS, MARK_ALL_READ_FILTER_SCOPE, MARK_ALL_READ_NO_JUMP_ON_FAILURE, MARK_ALL_READ_JUMP_TO_NEXT, STALE_SESSION_PROTECTION, PARTIAL_FAILURE_RECONCILIATION, COUNTS_REFRESH | 5, 11 (`phase2c-list-regression.jsx`; helper assertions remain in existing utility tests) |

## Existing List Regression Ownership

The current repository has helper-level tests for filtered totals and successful list reconciliation, but no automated behavior harness for the complete PR #11 Mark All Read flow. The dedicated `scripts/tests/phase2c-list-regression.jsx` harness is the exact runtime owner for the named integration gates; Task 11 only verifies its gate registry and runs it.

| Gate | Existing repository coverage | Exact focused owner after implementation |
| --- | --- | --- |
| NO_ALL_RANKING | No runtime assertion currently proves ordinary All order is unaffected by Home projection. | `scripts/tests/phase2c-list-regression.jsx` scenario `NO_ALL_RANKING` (Task 2); suite registry (Task 11). |
| NO_UNREAD_RANKING | No runtime assertion currently proves ordinary Unread order is unaffected by Home projection. | `scripts/tests/phase2c-list-regression.jsx` scenario `NO_UNREAD_RANKING` (Task 2); suite registry (Task 11). |
| ALL_SORT_PREFERENCE_PRESERVED | No current regression test covers the end-to-end list request; the planned request-key test covers only key invalidation. | `src/utils/article-list-request-key.test.js` plus runtime scenario `ALL_SORT_PREFERENCE_PRESERVED` in `scripts/tests/phase2c-list-regression.jsx` (Task 2). |
| UNREAD_FILTER_PRESERVED | `src/utils/article-list-request-key.test.js` will cover key inclusion, not rendered/request behavior alone. | That unit suite plus runtime scenario `UNREAD_FILTER_PRESERVED` in `scripts/tests/phase2c-list-regression.jsx` (Task 2). |
| MARK_ALL_READ_SUCCESS | No current automated component/runtime test covers FooterPanel success and completion. | `scripts/tests/phase2c-list-regression.jsx` scenario `MARK_ALL_READ_SUCCESS` (Task 5). |
| MARK_ALL_READ_FILTER_SCOPE | `src/utils/reconcile-entries-after-mark-read.test.js` covers a supplied ID subset, not search/date API scope. | Runtime scenario `MARK_ALL_READ_FILTER_SCOPE` in `scripts/tests/phase2c-list-regression.jsx` with deterministic search/date fixture (Task 5). |
| MARK_ALL_READ_NO_JUMP_ON_FAILURE | No current automated test covers the failed mutation navigation path. | Runtime scenario `MARK_ALL_READ_NO_JUMP_ON_FAILURE` in `scripts/tests/phase2c-list-regression.jsx` (Task 5). |
| MARK_ALL_READ_JUMP_TO_NEXT | No current automated test covers successful next-unread feed selection. | Runtime scenario `MARK_ALL_READ_JUMP_TO_NEXT` in `scripts/tests/phase2c-list-regression.jsx` (Task 5). |
| STALE_SESSION_PROTECTION | Production mutation/request guards exist, but this cross-session behavior has no dedicated test. | Deferred settlement scenario `STALE_SESSION_PROTECTION` in `scripts/tests/phase2c-list-regression.jsx`; Home count stale guard is separately tested in `scripts/tests/phase2c-editorial-home.jsx` (Tasks 5 and 10). |
| PARTIAL_FAILURE_RECONCILIATION | `src/utils/reconcile-entries-after-mark-read.test.js` proves pure successful subset/batch reconciliation, not failure in a later API batch. | Runtime scenario `PARTIAL_FAILURE_RECONCILIATION` in `scripts/tests/phase2c-list-regression.jsx`, failing a later batch and verifying only confirmed results remain reconciled (Task 5). |
| COUNTS_REFRESH | `src/utils/article-list-filters.test.js` covers the total-refresh predicate; it does not prove refreshed feed/global counts. | Runtime scenario `COUNTS_REFRESH` in `scripts/tests/phase2c-list-regression.jsx`, verifying source/global count refresh after success and failure (Task 5). |

## Visual Harness and Device Validation

The dedicated harness in Task 10 covers 390×844, 768×1024, 884×1104, 1024×768, 1280×800, and 1440×900 in light and dark/OLED. It includes 3+ unread with image Primary; 3+ with text-only Primary; 2 unread; 1 unread; 0 unread; mixed image/text-only; diverse and same source/category; loading; initial error; explicit refresh failure retaining content; load-more error; after read/backfill; after mark-unread; and after star/unstar.

Automatable gates: HOME_NO_OVERFLOW, HOME_SECTION_HIERARCHY, HOME_PRIMARY_TEXT_ONLY, HOME_SECONDARY_LAYOUT, HOME_RECENT_GRID, HOME_EMPTY_RECENT, HOME_LOADING, HOME_REFRESH_ERROR_WITH_CONTENT, HOME_IDENTITY_FAILURE_RECOVERY, HOME_LAST_READ_TRANSITIONS_TO_TUDO_EM_DIA, HOME_READ_FAILURE_DOES_NOT_ZERO_TOTAL, HOME_MARK_UNREAD_RECONCILES_TOTAL, HOME_UNLOADED_MARK_UNREAD_REENABLES_PAGINATION, HOME_TOTAL_RECONCILIATION_STALE_SESSION_PROTECTED, HOME_LIGHT, and HOME_DARK. Also report computed columns, section order, duplicate entry IDs, sentinel count, count-query visibility parameters, loaded eligible unread ID count, loadMoreVisible, and scroll-root dimensions. `scripts/tests/phase2c-list-regression.jsx` separately reports each All/Unread and Mark All Read gate from the ownership table.

Before merge, run a manual perceptual real-device gate at 884×1104 and at least one narrow mobile/Fold device. Record device, viewport, exact deployed SHA, theme, and screenshots. Mark each item PASS/FAIL with observations:

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

The harness can verify geometry, computed CSS, order, and state transitions; it cannot establish perceived editorial hierarchy, material quality, touch comfort, or absence of perceptual layout jump. Do not run this device gate as part of the planning-only task.

## Exact-SHA Deployment Gate

Do not deploy a branch name or implicit latest. After the implementation PR has an approved exact SHA, use only:

- STACK=/dockerdata/compose/newsflux
- REPO=/dockerdata/compose/newsflux/repo
- CONTAINER=newsflux
- IMAGE=newsflux-local:<shortcommit>
- NETWORK=npm-proxyyml_default
- INTERNAL=http://newsflux:2000

Future sequence: checkout and verify the exact approved SHA in the deployment repo; build and tag that exact commit image; validate the compose configuration; recreate the named container; probe the internal HTTP URL; verify container health and network attachment; verify Miniflux health; then run the real-device gate against the deployed SHA. Record each SHA and result. A failed probe or health check blocks the device gate and merge. No deployment is authorized or performed by this plan document task.

## Out of Scope

Do not include upstream sync; NAV-01 swipe-to-open-feed selector; NAV-02 unread-first feed selector; Phase 2D personalization; persisted behavioral history; machine-learning ranking; a new user-state database; unrelated Grid redesign; Sidebar redesign beyond the root Home action; reader redesign; Liquid Glass recalibration; SEARCH_QUERY_CLEARED_ON_ARTICLE_CLOSE; HydrateFallback cleanup; unrelated global skeleton cleanup; or opportunistic Content/FooterPanel refactoring. Any incidental finding follows REPORT → BACKLOG.

## Spec Coverage Self-Review

All numbered spec sections are assigned below; the implementation worker must keep this map current if task boundaries change:

| Spec section | Task or gate |
| --- | --- |
| 1 Purpose and product intent | Tasks 1–11; Home is deterministic and unread-oriented |
| 2 Routing and startup contract | Tasks 3–4; explicit `useMatch` → `entryIdOverride` bridge and parent-instance runtime gate |
| 3 Canonical Home data contract | Task 2; page and count requests share the canonical query builder |
| 4 One loaded set and presentation projection | Tasks 1–2, 7 |
| 5 Initial Highlight selection | Task 1 |
| 6 Highlight stability | Tasks 5, 7–8 |
| 7 Successful read mutation and one-slot backfill | Tasks 1, 5; successful status settlement also triggers guarded Home total reconciliation in Task 2 |
| 8 Mark unread | Task 5 |
| 9 Star and unstar | Task 5 |
| 10 Pagination | Task 7 |
| 11 Ephemeral Home session state | Tasks 4–5 |
| 12 Session invalidation and stale responses | Tasks 2, 4–5; stale total/count response gate in Task 5 |
| 13 Reader origin and return | Tasks 4–5 |
| 14 Counts and Mark All Read | Tasks 2, 5, 11; Home count reconciliation and focused existing-list harness |
| 15 Visual structure | Tasks 6–9 |
| 16 Primary Highlight | Tasks 1, 6, 9–10 |
| 17 Secondary Highlights | Tasks 1, 6, 9–10 |
| 18 Recent | Tasks 7, 9–10 |
| 19 Section headers and controls | Tasks 4, 9 |
| 20 Responsive contract | Tasks 9–10 |
| 21 Density | Tasks 9–10 and real-device gate |
| 22 Initial loading | Task 8 |
| 23 Low unread counts | Tasks 1, 8 |
| 24 Empty Recent | Tasks 7–8 |
| 25 Zero unread | Tasks 2, 5, 8; only a successful current page/count response can set canonical total to zero |
| 26 Initial and explicit refresh errors | Task 8 |
| 27 Load-more error | Tasks 7–8 |
| 28 Interactions and accessibility | Tasks 4, 6, 9–11 |
| 29 Themes and design contract | Tasks 9–10 |
| 30 Component and architectural boundaries | Tasks 4–9 |
| 31 Projection layer | Task 1 |
| 32 Card reuse | Tasks 6–7 |
| 33 Content.jsx boundary | Task 4 |
| 34 Pure-logic test strategy | Tasks 1, 5, 7, 11 |
| 35 Home functional gates | Tasks 2–8, 10–11; includes total reconciliation, pagination visibility, and identity recovery |
| 36 Existing regression gates | Tasks 2, 5, 11; exact owners are enumerated in Existing List Regression Ownership |
| 37 Visual harness | Tasks 4, 10; the separate focused list regression harness is created in Task 2 and extended in Task 5 |
| 38 Real-device gate | Pre-merge checklist above |
| 39 Deployment governance | Exact-SHA Deployment Gate above |
| 40 Out of scope | Global Constraints and Out of Scope above |
| 41 Residual risks | Review Focus and Tasks 2, 4, 5, 7, 8 |
| 42 Definition of done | Task 11 and pre-merge/device/deployment gates |

### Technical decision verification

- Route shape, root path normalization, close, history, direct links, and parent child-param bridge: HomePage uses `useMatch("/entry/:entryId")`, passes `entryIdOverride`, and tests this exact bridge and stable parent instance in Task 4.
- Post-login preference and migration boundary: decided above; tests owned by Task 3.
- Fixed query and same-semantics pageSize=1 total request: Task 2; success-only settlement trigger, stale guards, total commit, and loadMoreVisible recalculation: Task 5.
- Root identity failure owner: HomePageManager handles retry/logout on `/` and `/entry/:entryId`; HomeStates handles only article-query state. Catalog failure does not gate Home's canonical query. Task 4/10 owns the recovery gate.
- Dead HomeRedirect CSS: repository search found only the import in HomeRedirect.jsx; Task 4 removes the component and its stylesheet together.
- Session holder and invalidation: decided above; tests owned by Tasks 4–5.
- ID tie directions: ascending for all three; Task 1.
- Missing metadata: null is not novel; Task 1.
- Zero unread signal: successful response total only; Task 8.
- Pending mutation behavior: preserve projection until settlement; Task 5.
- Empty Recent sentinel: one shared component after the complete scroll composition; Task 7.

### Review outcome

- SPEC_COVERAGE: all sections 1–42 mapped; no uncovered section identified.
- STEP_SCAN: every task uses one checkable action per step; no implementation step asks for unspecified edge-case work.
- TYPE_AND_INTERFACE_CONSISTENCY: projection IDs flow into the Home session; Home request policy flows through the existing hook/API adapter; mutation events flow into the session transition; the sentinel uses the existing load-more hook.
- REVIEW_FOCUS_COVERAGE: all five risk classes have explicit tests in their owning tasks.
- READER_PARAM_BRIDGE_EXPLICIT: HomePage `useMatch` passes `entryIdOverride`; direct links and existing list routes retain explicit coverage.
- HOME_PARENT_MOUNT_PRESERVATION_TESTED: Task 4 runtime scenario records the Home session instance across `/` → `/entry/101` → `/`.
- HOME_TOTAL_RECONCILIATION_DEFINED: Task 2 exposes the same-query `getHomeEntries({ pageSize: 1 })` adapter; Task 5 uses it inside the existing guarded total-refresh infrastructure.
- HOME_LAST_READ_ZERO_STATE_TESTED: Task 5 tests confirmed last read to total zero; failed mutation leaves total unchanged.
- HOME_UNREAD_PAGINATION_RECONCILIATION_TESTED: Task 5 verifies unread total growth toggles the shared sentinel without an entry-specific fetch.
- HOME_TOTAL_STALE_SESSION_GUARD: deferred old-session count response is ignored in the Home runtime harness.
- HOME_IDENTITY_FAILURE_OWNER_EXPLICIT: HomePageManager owns root identity recovery; query errors remain in HomeStates.
- HOME_IDENTITY_FAILURE_GATE_PRESENT: HOME_IDENTITY_FAILURE_RECOVERY is registered in Tasks 4 and 10.
- MARK_ALL_READ_TEST_OWNERS_EXPLICIT: every preserved PR #11 gate has an exact test/harness owner in the ownership table.
- TASK11_NOT_MISC_TEST_BUCKET: Task 11 only verifies matrix registration and runs the focused suites.
- DEAD_HOMEREDIRECT_CSS_CHECKED: only consumer was the removed HomeRedirect component; CSS removal is included in Task 4.
- REMAINING_REQUIRED_REVIEW_FLAGS: SPEC_COVERAGE, INTERFACE_CONSISTENCY, REVIEW_FOCUS_COVERAGE, and SCOPE_REVIEW remain PASS after this bounded document revision.
- PROPORTION: the plan specifies interfaces and assertions without prescribing full component bodies.
- SCOPE: only the approved Phase 2C design, its tests, harness, and required pre-merge gates are included.

## Pre-Merge Definition of Done

Merge remains blocked until all functional gates, existing regressions, pure tests, lint, Prettier, build, diff check, Phase 2B.2C harness, Phase 2C viewport/theme harness, exact-SHA deployment checks, and real-device checklist pass. Record residual infrastructure limitations without misclassifying harness-only findings as production defects. Obtain explicit merge authorization from the user; this plan grants none.

**Next action:** review this implementation plan and choose whether to execute it using the subagent-driven or sequential execution approach.
