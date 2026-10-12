import assert from "node:assert/strict"
import { test } from "node:test"

const homePage = await import(new URL("home-page.js", import.meta.url))

const firstIdentity = { server: "https://first.example/miniflux", userId: 7 }
const secondIdentity = { server: "https://second.example/miniflux", userId: 8 }
const homeTarget = { type: "view", id: "home" }
const allTarget = { type: "view", id: "all" }
const oldPreferences = (entries = []) => ({ legacyMigrated: true, entries })

test("defaults new identities to Home", () => {
  assert.deepEqual(homePage.getHomeTargetForIdentity(undefined, firstIdentity), homeTarget)
  assert.deepEqual(homePage.getHomeTargetForIdentity(undefined, null), homeTarget)
  assert.equal(homePage.getHomeTargetPath(homeTarget), "/")
  assert.deepEqual(homePage.createViewHomeTarget("home"), homeTarget)
})

test("migrates legacy All destination to Home once", () => {
  const old = oldPreferences([
    { ...firstIdentity, target: allTarget },
    { ...secondIdentity, target: allTarget },
  ])
  assert.deepEqual(homePage.getHomeTargetForIdentity(old, firstIdentity), homeTarget)
  const migrated = homePage.ensureHomeIdentity(old, firstIdentity)
  assert.equal(migrated.postLoginMigrated, true)
  assert.deepEqual(homePage.getHomeTargetForIdentity(migrated, secondIdentity), homeTarget)
  assert.deepEqual(homePage.ensureHomeIdentity(migrated, firstIdentity), migrated)
  assert.deepEqual(old.entries[0].target, allTarget)
  assert.equal(old.postLoginMigrated, undefined)
  assert.deepEqual(
    homePage.getHomeTargetForIdentity(homePage.createDefaultHomePages(), firstIdentity, "all"),
    homeTarget,
  )
})

test("preserves explicit legacy destinations for Today Starred History Feed and Category", () => {
  for (const [target, path] of [
    [{ type: "view", id: "today" }, "/today"],
    [{ type: "view", id: "starred" }, "/starred"],
    [{ type: "view", id: "history" }, "/history"],
    [{ type: "feed", id: 42 }, "/feed/42"],
    [{ type: "category", id: 9 }, "/category/9"],
  ]) {
    const old = oldPreferences([{ ...firstIdentity, target }])
    const migrated = homePage.ensureHomeIdentity(old, firstIdentity)
    assert.deepEqual(homePage.getHomeTargetForIdentity(migrated, firstIdentity), target)
    assert.equal(homePage.getHomeTargetPath(target), path)
    assert.equal(migrated.postLoginMigrated, true)
    if (target.type === "view") {
      const legacy = homePage.ensureHomeIdentity(undefined, firstIdentity, target.id)
      assert.deepEqual(homePage.getHomeTargetForIdentity(legacy, firstIdentity), target)
      assert.deepEqual(homePage.getHomeTargetForIdentity(legacy, secondIdentity), homeTarget)
    }
  }
})

test("allows selecting All as a post-login destination after migration", () => {
  const migrated = homePage.ensureHomeIdentity(undefined, firstIdentity)
  const selected = homePage.setHomeTargetForIdentity(migrated, firstIdentity, allTarget)
  const storedPreferences = JSON.stringify(selected)
  const reloaded = homePage.sanitizeHomePages(JSON.parse(storedPreferences))
  assert.equal(reloaded.postLoginMigrated, true)
  assert.deepEqual(homePage.getHomeTargetForIdentity(reloaded, firstIdentity), allTarget)
  assert.deepEqual(homePage.ensureHomeIdentity(reloaded, firstIdentity), reloaded)
  assert.equal(homePage.getHomeTargetPath(allTarget), "/all")
})

test("uses the destination for the matching server and user only", () => {
  const migrated = homePage.ensureHomeIdentity(undefined, firstIdentity)
  const first = homePage.setHomeTargetForIdentity(migrated, firstIdentity, {
    type: "feed",
    id: 42,
  })
  const saved = homePage.setHomeTargetForIdentity(first, secondIdentity, {
    type: "view",
    id: "starred",
  })
  assert.equal(
    homePage.getHomeTargetPath(homePage.getHomeTargetForIdentity(saved, firstIdentity)),
    "/feed/42",
  )
  assert.equal(
    homePage.getHomeTargetPath(homePage.getHomeTargetForIdentity(saved, secondIdentity)),
    "/starred",
  )
  for (const identity of [
    { ...firstIdentity, userId: secondIdentity.userId },
    { ...secondIdentity, userId: firstIdentity.userId },
  ]) {
    assert.deepEqual(homePage.getHomeTargetForIdentity(saved, identity), homeTarget)
  }
})

test("explicit deep-link from state wins over the saved preference", () => {
  assert.equal(typeof homePage.getPostLoginPath, "function")
  const saved = homePage.setHomeTargetForIdentity(undefined, firstIdentity, {
    type: "feed",
    id: 42,
  })
  assert.equal(homePage.getPostLoginPath({ homePages: saved, identity: firstIdentity }), "/feed/42")
  assert.equal(homePage.getPostLoginPath({ homePages: saved, identity: secondIdentity }), "/")
  for (const explicitFrom of ["/entry/99", "/today/entry/99", "/", "/all"]) {
    assert.equal(
      homePage.getPostLoginPath({ homePages: saved, identity: firstIdentity, explicitFrom }),
      explicitFrom,
    )
  }
  const explicitFrom = { pathname: "/entry/99", search: "?view=reader", hash: "#detail" }
  assert.deepEqual(
    homePage.getPostLoginPath({ homePages: saved, identity: firstIdentity, explicitFrom }),
    explicitFrom,
  )
})
