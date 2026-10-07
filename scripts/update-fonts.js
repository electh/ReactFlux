import {
  appendFile,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { setTimeout as sleep } from "node:timers/promises"
import { fileURLToPath } from "node:url"

import {
  calculateHash,
  FONT_FAMILIES,
  FONT_LIMITS,
  inspectWoff2,
  localizeGoogleFontCss,
  validateFontAssets,
  validateRemoteUrl,
} from "./font-assets.js"

const { dirname, join, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, "..")
const PUBLIC_DIR = join(PROJECT_ROOT, "public")
const FONTS_DIR = join(PUBLIC_DIR, "fonts")
const FONTS_CSS = join(PUBLIC_DIR, "styles", "fonts.css")
const VERSION_FILE = join(FONTS_DIR, "version.json")

const GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const FETCH_ATTEMPTS = 3
const FETCH_TIMEOUT_MS = 30_000

class AssetRollbackError extends AggregateError {}
class PermanentFetchError extends Error {}
class RetryableFetchError extends Error {}

function buildGoogleFontsUrl(fontFamily, weights, styles) {
  const familyParam = fontFamily.replaceAll(" ", "+")
  const styleSpecs = weights.flatMap((weight) =>
    styles.map((style) => (style === "italic" ? `1,${weight}` : `${weight}`)),
  )
  const url = `${GOOGLE_FONTS_API}?family=${familyParam}:wght@${styleSpecs.join(";")}&display=swap`
  validateRemoteUrl(url, "fonts.googleapis.com")
  return url
}

async function readResponseBody(response, maxBytes) {
  const contentLength = response.headers.get("content-length")
  let declaredLength = null
  if (contentLength !== null) {
    declaredLength = Number(contentLength)
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw new PermanentFetchError(`Invalid Content-Length: ${contentLength}`)
    }
    if (declaredLength > maxBytes) {
      throw new PermanentFetchError(
        `Response declares ${declaredLength} bytes, exceeding the ${maxBytes}-byte limit`,
      )
    }
  }
  if (!response.body) {
    throw new RetryableFetchError("Response body is empty")
  }

  const chunks = []
  let received = 0
  for await (const chunk of response.body) {
    const buffer = Buffer.from(chunk)
    received += buffer.length
    if (received > maxBytes) {
      throw new PermanentFetchError(`Response exceeded the ${maxBytes}-byte limit`)
    }
    chunks.push(buffer)
  }

  if (received === 0) {
    throw new RetryableFetchError("Response body is empty")
  }
  if (declaredLength !== null && received !== declaredLength) {
    throw new RetryableFetchError(
      `Response body has ${received} bytes, but Content-Length declared ${declaredLength}`,
    )
  }
  return Buffer.concat(chunks, received)
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500
}

export async function fetchWithPolicy(
  url,
  {
    contentType,
    expectedHostname,
    fetchImplementation = globalThis.fetch,
    headers = {},
    maxBytes,
    random = Math.random,
    sleepImplementation = sleep,
  },
) {
  const validatedUrl = validateRemoteUrl(url, expectedHostname)
  let lastError

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImplementation(validatedUrl, {
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      if (response.status >= 300 && response.status < 400) {
        throw new PermanentFetchError(`Redirects are not allowed (${response.status})`)
      }
      if (!response.ok) {
        const ErrorType = isRetryableStatus(response.status)
          ? RetryableFetchError
          : PermanentFetchError
        throw new ErrorType(`HTTP ${response.status} ${response.statusText}`)
      }

      let finalUrl
      try {
        finalUrl = validateRemoteUrl(response.url || validatedUrl.href, expectedHostname)
      } catch (error) {
        throw new PermanentFetchError(error.message, { cause: error })
      }
      if (finalUrl.href !== validatedUrl.href) {
        throw new PermanentFetchError(`Response URL changed unexpectedly to ${finalUrl.href}`)
      }

      const actualContentType = response.headers.get("content-type")?.split(";", 1)[0].trim()
      if (actualContentType !== contentType) {
        throw new PermanentFetchError(
          `Expected Content-Type ${contentType}, got ${actualContentType || "missing"}`,
        )
      }

      return await readResponseBody(response, maxBytes)
    } catch (error) {
      if (error instanceof PermanentFetchError) {
        throw new Error(`Rejected ${validatedUrl.href}: ${error.message}`, { cause: error })
      }

      lastError = error
      if (attempt === FETCH_ATTEMPTS) {
        break
      }

      const delay = 500 * 2 ** (attempt - 1) + Math.floor(random() * 250)
      console.warn(
        `  Attempt ${attempt}/${FETCH_ATTEMPTS} failed for ${validatedUrl.hostname}; retrying in ${delay}ms: ${error.message}`,
      )
      await sleepImplementation(delay)
    }
  }

  throw new Error(`Failed to fetch ${validatedUrl.href} after ${FETCH_ATTEMPTS} attempts`, {
    cause: lastError,
  })
}

async function fetchGoogleFontsCss(fontConfig) {
  const url = buildGoogleFontsUrl(fontConfig.name, fontConfig.weights, fontConfig.styles)
  console.log(`Fetching CSS for ${fontConfig.name}...`)
  const buffer = await fetchWithPolicy(url, {
    contentType: "text/css",
    expectedHostname: "fonts.googleapis.com",
    headers: { "User-Agent": USER_AGENT },
    maxBytes: FONT_LIMITS.cssBytes,
  })
  const css = buffer.toString("utf8")
  if (css.includes("\u0000")) {
    throw new Error(`${fontConfig.name} CSS contains a null byte`)
  }
  return css
}

async function copyImmutableTtf(fontConfig, stagedFontDir) {
  for (const { filename } of fontConfig.ttf) {
    await copyFile(join(FONTS_DIR, fontConfig.dir, filename), join(stagedFontDir, filename))
  }
}

async function updateFontFamily(fontConfig, stagedFontsDir) {
  console.log(`\n=== Updating ${fontConfig.name} ===`)
  const remoteCss = await fetchGoogleFontsCss(fontConfig)
  const { css: localizedCss, fonts: remoteFonts } = localizeGoogleFontCss(remoteCss, fontConfig)
  console.log(`Found ${remoteFonts.length} font file(s)`)

  const stagedFontDir = join(stagedFontsDir, fontConfig.dir)
  await mkdir(stagedFontDir, { recursive: true })
  await copyImmutableTtf(fontConfig, stagedFontDir)

  const downloadResults = await Promise.allSettled(
    remoteFonts.map(async ({ filename, url }, index) => {
      console.log(`  [${index + 1}/${remoteFonts.length}] Downloading ${filename}...`)
      const buffer = await fetchWithPolicy(url, {
        contentType: "font/woff2",
        expectedHostname: "fonts.gstatic.com",
        maxBytes: FONT_LIMITS.fontBytesMax,
      })
      if (buffer.length < FONT_LIMITS.fontBytesMin) {
        throw new Error(`${fontConfig.name}/${filename} is only ${buffer.length} bytes`)
      }
      inspectWoff2(buffer)
      await writeFile(join(stagedFontDir, filename), buffer)
      return { filename, hash: calculateHash(buffer), size: buffer.length }
    }),
  )
  const failures = downloadResults.filter((result) => result.status === "rejected")
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map(({ reason }) => reason),
      `${fontConfig.name} failed to download ${failures.length} font file(s)`,
    )
  }
  const downloadedFonts = downloadResults.map(({ value }) => value)

  const familyBytes = downloadedFonts.reduce((total, font) => total + font.size, 0)
  if (familyBytes > FONT_LIMITS.familyBytes) {
    throw new Error(`${fontConfig.name} totals ${familyBytes} bytes, exceeding its limit`)
  }

  return {
    css: localizedCss,
    hashes: downloadedFonts.map(({ filename, hash }) => ({ filename, hash })),
  }
}

function buildVersionInfo(results) {
  const fonts = {}
  for (const [index, result] of results.entries()) {
    const fontConfig = FONT_FAMILIES[index]
    fonts[fontConfig.name] = {
      dir: fontConfig.dir,
      files: result.hashes.length,
      hashes: result.hashes,
    }
  }

  return { lastUpdate: new Date().toISOString(), fonts }
}

function comparableManifest(versionInfo) {
  return JSON.stringify(versionInfo.fonts)
}

async function assetsChanged(versionInfo, cssContent) {
  try {
    const [oldVersionText, oldCss] = await Promise.all([
      readFile(VERSION_FILE, "utf8"),
      readFile(FONTS_CSS, "utf8"),
    ])
    const oldVersion = JSON.parse(oldVersionText)
    return (
      comparableManifest(oldVersion) !== comparableManifest(versionInfo) || oldCss !== cssContent
    )
  } catch {
    return true
  }
}

async function rollbackAssetSwap(
  {
    backupCss,
    backupFonts,
    cssBackedUp,
    cssInstalled,
    fontsBackedUp,
    fontsCss,
    fontsDir,
    fontsInstalled,
  },
  { renameImplementation, rmImplementation },
) {
  const rollbackErrors = []

  try {
    if (cssInstalled) {
      await rmImplementation(fontsCss, { force: true })
    }
    if (cssBackedUp) {
      await renameImplementation(backupCss, fontsCss)
    }
  } catch (error) {
    rollbackErrors.push(error)
  }

  try {
    if (fontsInstalled) {
      await rmImplementation(fontsDir, { force: true, recursive: true })
    }
    if (fontsBackedUp) {
      await renameImplementation(backupFonts, fontsDir)
    }
  } catch (error) {
    rollbackErrors.push(error)
  }

  return rollbackErrors
}

export async function installStagedAssets({
  fontsCss = FONTS_CSS,
  fontsDir = FONTS_DIR,
  renameImplementation = rename,
  rmImplementation = rm,
  stageRoot,
  stagedCssPath,
  stagedFontsDir,
}) {
  const backupFonts = join(stageRoot, "backup-fonts")
  const backupCss = join(stageRoot, "backup-fonts.css")
  const state = {
    backupCss,
    backupFonts,
    cssBackedUp: false,
    cssInstalled: false,
    fontsBackedUp: false,
    fontsCss,
    fontsDir,
    fontsInstalled: false,
  }

  try {
    await renameImplementation(fontsDir, backupFonts)
    state.fontsBackedUp = true
    await renameImplementation(stagedFontsDir, fontsDir)
    state.fontsInstalled = true

    await renameImplementation(fontsCss, backupCss)
    state.cssBackedUp = true
    await renameImplementation(stagedCssPath, fontsCss)
    state.cssInstalled = true
  } catch (error) {
    const rollbackErrors = await rollbackAssetSwap(state, {
      renameImplementation,
      rmImplementation,
    })
    if (rollbackErrors.length > 0) {
      throw new AssetRollbackError(
        [error, ...rollbackErrors],
        `Font asset installation and rollback failed; recovery files remain in ${stageRoot}`,
      )
    }
    throw error
  }
}

async function writeGithubOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `changes=${result.changed}`,
      `font_count=${FONT_FAMILIES.length}`,
      `file_count=${result.totalFiles}`,
      `structural_change=${result.structuralChanges.length > 0}`,
      "",
    ].join("\n"),
  )
}

export async function commitValidatedUpdate(
  result,
  { installImplementation, writeOutputsImplementation = writeGithubOutputs },
) {
  await writeOutputsImplementation(result)
  if (result.changed) {
    await installImplementation()
  }
}

export async function updateFonts() {
  console.log("Starting transactional font update process...\n")
  const stageRoot = await mkdtemp(join(PUBLIC_DIR, ".font-update-"))
  let preserveStageForRecovery = false
  const stagedFontsDir = join(stageRoot, "fonts")
  const stagedCssPath = join(stageRoot, "fonts.css")
  const stagedVersionPath = join(stagedFontsDir, "version.json")

  try {
    await mkdir(stagedFontsDir, { recursive: true })
    const results = []
    for (const fontConfig of FONT_FAMILIES) {
      results.push(await updateFontFamily(fontConfig, stagedFontsDir))
    }

    const versionInfo = buildVersionInfo(results)
    const cssContent = `${results.map(({ css }) => css.trim()).join("\n\n")}\n`
    await Promise.all([
      writeFile(stagedCssPath, cssContent, "utf8"),
      writeFile(stagedVersionPath, `${JSON.stringify(versionInfo, null, 2)}\n`, "utf8"),
    ])

    const validation = await validateFontAssets({
      cssPath: stagedCssPath,
      fontsDir: stagedFontsDir,
      versionPath: stagedVersionPath,
    })
    const changed = await assetsChanged(versionInfo, cssContent)
    const result = { changed, ...validation }

    // Publish fallible metadata before committing the staged filesystem transaction.
    await commitValidatedUpdate(result, {
      installImplementation: () =>
        installStagedAssets({ stageRoot, stagedFontsDir, stagedCssPath }),
    })
    if (changed) {
      console.log("\n✓ Validated assets installed transactionally")
    } else {
      console.log("\n✓ Fonts are already up to date")
    }

    console.log(`Validated ${validation.totalFiles} files across ${FONT_FAMILIES.length} families`)
    if (validation.structuralChanges.length > 0) {
      console.warn(
        "⚠ Font paths differ from the reviewed baseline; automatic merge will remain blocked",
      )
    }
    return result
  } catch (error) {
    preserveStageForRecovery = error instanceof AssetRollbackError
    throw error
  } finally {
    if (preserveStageForRecovery) {
      console.error(`Preserving ${stageRoot} for manual recovery`)
    } else {
      try {
        await rm(stageRoot, { force: true, recursive: true })
      } catch (error) {
        console.error(`Could not remove temporary directory ${stageRoot}: ${error.message}`)
      }
    }
  }
}

if (resolve(process.argv[1] ?? "") === __filename) {
  try {
    const result = await updateFonts()
    console.log(result.changed ? "\n✓ Fonts have been updated!" : "\n✓ Fonts are up to date!")
  } catch (error) {
    console.error("\n✗ Update failed:", error)
    process.exitCode = 1
  }
}
