import { createHash } from "node:crypto"
import { lstat, readdir, readFile } from "node:fs/promises"
import path from "node:path"

import * as fontkit from "fontkit"
import postcss from "postcss"

import baseline from "./font-baseline.json" with { type: "json" }

const { join } = path

const FONT_REQUESTS = [
  { name: "Fira Sans", weights: [400], styles: ["normal"] },
  { name: "Noto Sans", weights: [400], styles: ["normal"] },
  { name: "Noto Serif", weights: [400], styles: ["normal"] },
  { name: "Open Sans", weights: [400], styles: ["normal"] },
  { name: "Source Sans Pro", weights: [400], styles: ["normal"] },
  { name: "Source Serif Pro", weights: [400], styles: ["normal"] },
]

export const FONT_FAMILIES = FONT_REQUESTS.map((request) => {
  const familyBaseline = baseline.families[request.name]
  if (!familyBaseline) {
    throw new Error(`Missing baseline for ${request.name}`)
  }

  return Object.freeze({ ...request, ...familyBaseline })
})

export const FONT_LIMITS = Object.freeze({
  cssBytes: 512 * 1024,
  familyBytes: 2 * 1024 * 1024,
  familyFilesMax: 15,
  familyFilesMin: 3,
  fontBytesMax: 256 * 1024,
  fontBytesMin: 2 * 1024,
  sfntBytesMax: 4 * 1024 * 1024,
  totalBytes: 8 * 1024 * 1024,
  ttfBytesMax: 2 * 1024 * 1024,
  totalFilesMax: 90,
  totalFilesMin: 18,
})

const REMOTE_SRC_PATTERN =
  /^url\((?:"([^"]+)"|'([^']+)'|([^\s"')]+))\)\s+format\((?:"woff2"|'woff2'|woff2)\)$/i
const LOCAL_SRC_PATTERN =
  /^url\((?:"([^"']+)"|'([^"']+)'|([^\s"')]+))\)\s+format\((?:"woff2"|'woff2'|woff2)\)$/i
const SAFE_FONT_FILENAME = /^[A-Za-z0-9_-]+\.woff2$/
const SAFE_TTF_FILENAME = /^[A-Za-z0-9_-]+\.ttf$/

export function calculateHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

export function inspectWoff2(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError("WOFF2 data must be a Buffer")
  }
  if (buffer.length < 48) {
    throw new Error(`WOFF2 file is shorter than its 48-byte header (${buffer.length} bytes)`)
  }
  if (buffer.toString("ascii", 0, 4) !== "wOF2") {
    throw new Error("WOFF2 signature is invalid")
  }

  const header = {
    flavor: buffer.readUInt32BE(4),
    length: buffer.readUInt32BE(8),
    numTables: buffer.readUInt16BE(12),
    reserved: buffer.readUInt16BE(14),
    totalSfntSize: buffer.readUInt32BE(16),
    totalCompressedSize: buffer.readUInt32BE(20),
  }

  if (header.length !== buffer.length) {
    throw new Error(`WOFF2 header length ${header.length} does not match ${buffer.length} bytes`)
  }
  if (header.numTables === 0 || header.numTables > 256) {
    throw new Error(`WOFF2 table count is invalid: ${header.numTables}`)
  }
  if (header.reserved !== 0) {
    throw new Error(`WOFF2 reserved header field must be zero, got ${header.reserved}`)
  }
  if (header.totalSfntSize === 0 || header.totalCompressedSize === 0) {
    throw new Error("WOFF2 declares an empty compressed or SFNT payload")
  }
  if (header.totalSfntSize > FONT_LIMITS.sfntBytesMax) {
    throw new Error(`WOFF2 expands to ${header.totalSfntSize} bytes, exceeding its limit`)
  }
  if (header.totalCompressedSize > buffer.length - 48) {
    throw new Error("WOFF2 compressed payload exceeds the file size")
  }

  return header
}

export function validateRemoteUrl(value, expectedHostname) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`Invalid URL: ${value}`)
  }

  if (url.protocol !== "https:") {
    throw new Error(`URL must use HTTPS: ${value}`)
  }
  if (url.hostname !== expectedHostname || url.port !== "") {
    throw new Error(`URL must use ${expectedHostname}: ${value}`)
  }
  if (url.username || url.password || url.hash) {
    throw new Error(`URL contains forbidden credentials or fragment: ${value}`)
  }

  return url
}

function readRequiredDeclaration(rule, property) {
  const declarations = rule.nodes.filter(
    (node) => node.type === "decl" && node.prop.toLowerCase() === property,
  )
  if (declarations.length !== 1) {
    throw new Error(`@font-face must contain exactly one ${property} declaration`)
  }
  return declarations[0]
}

function unquote(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function validateFontFaceMetadata(rule, fontConfig) {
  const family = unquote(readRequiredDeclaration(rule, "font-family").value)
  const style = unquote(readRequiredDeclaration(rule, "font-style").value)
  const weight = unquote(readRequiredDeclaration(rule, "font-weight").value)

  if (family !== fontConfig.name) {
    throw new Error(`Expected font family ${fontConfig.name}, got ${family}`)
  }
  if (!fontConfig.styles.includes(style)) {
    throw new Error(`Unexpected style ${style} for ${fontConfig.name}`)
  }
  if (!fontConfig.weights.includes(Number(weight))) {
    throw new Error(`Unexpected weight ${weight} for ${fontConfig.name}`)
  }
}

function parseFontStylesheet(css, fontConfig, source) {
  const root = postcss.parse(css, { from: source })
  const fontFaces = []

  for (const node of root.nodes) {
    if (node.type === "comment") {
      continue
    }
    if (node.type !== "atrule" || node.name.toLowerCase() !== "font-face" || !node.nodes) {
      throw new Error(`Unexpected CSS node in ${source}: ${node.type} ${node.name ?? ""}`)
    }
    validateFontFaceMetadata(node, fontConfig)
    fontFaces.push(node)
  }

  if (
    fontFaces.length < FONT_LIMITS.familyFilesMin ||
    fontFaces.length > FONT_LIMITS.familyFilesMax
  ) {
    throw new Error(
      `${fontConfig.name} returned ${fontFaces.length} font faces; expected ${FONT_LIMITS.familyFilesMin}-${FONT_LIMITS.familyFilesMax}`,
    )
  }

  return { root, fontFaces }
}

export function localizeGoogleFontCss(css, fontConfig) {
  const { root, fontFaces } = parseFontStylesheet(css, fontConfig, `${fontConfig.name} Google CSS`)
  const seenFilenames = new Set()
  const fonts = fontFaces.map((rule) => {
    const src = readRequiredDeclaration(rule, "src")
    const match = src.value.trim().match(REMOTE_SRC_PATTERN)
    if (!match) {
      throw new Error(`Unsupported src declaration for ${fontConfig.name}: ${src.value}`)
    }

    const remoteValue = match[1] ?? match[2] ?? match[3]
    const remoteUrl = validateRemoteUrl(remoteValue, "fonts.gstatic.com")
    const filename = remoteUrl.pathname.split("/").pop()
    if (!filename || !SAFE_FONT_FILENAME.test(filename)) {
      throw new Error(`Unsafe WOFF2 filename in ${remoteUrl.href}`)
    }
    if (seenFilenames.has(filename)) {
      throw new Error(`Duplicate WOFF2 filename for ${fontConfig.name}: ${filename}`)
    }
    seenFilenames.add(filename)

    src.value = `url(../fonts/${fontConfig.dir}/${filename}) format('woff2')`
    return { filename, url: remoteUrl.href }
  })

  const localizedCss = root.toString()
  if (/https?:\/\//i.test(localizedCss)) {
    throw new Error(`${fontConfig.name} CSS still contains a remote URL after localization`)
  }

  return { css: localizedCss, fonts }
}

function parseLocalFontCss(css, fontConfig, source) {
  const { fontFaces } = parseFontStylesheet(css, fontConfig, source)

  return fontFaces.map((rule) => {
    const src = readRequiredDeclaration(rule, "src")
    const match = src.value.trim().match(LOCAL_SRC_PATTERN)
    if (!match) {
      throw new Error(`Unsupported local src declaration for ${fontConfig.name}: ${src.value}`)
    }
    const localPath = match[1] ?? match[2] ?? match[3]
    const expectedPrefix = `../fonts/${fontConfig.dir}/`
    if (!localPath.startsWith(expectedPrefix)) {
      throw new Error(`Unexpected local path for ${fontConfig.name}: ${localPath}`)
    }
    const filename = localPath.slice(expectedPrefix.length)
    if (!SAFE_FONT_FILENAME.test(filename)) {
      throw new Error(`Unsafe local WOFF2 path for ${fontConfig.name}: ${localPath}`)
    }
    return filename
  })
}

function assertSameMembers(actual, expected, description) {
  const actualSorted = actual.toSorted()
  const expectedSorted = expected.toSorted()
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    throw new Error(
      `${description} mismatch\nExpected: ${expectedSorted.join(", ")}\nActual: ${actualSorted.join(", ")}`,
    )
  }
}

function validateFontWithParser(buffer, filename) {
  try {
    const font = fontkit.create(buffer)
    const characterCount = font.characterSet.length
    if (font.numGlyphs <= 0 || font.unitsPerEm <= 0 || characterCount <= 0) {
      throw new Error("font has no usable glyphs, character map, or units-per-em")
    }
  } catch (error) {
    throw new Error(`Font parser rejected ${filename}: ${error.message}`, { cause: error })
  }
}

function compareWithBaseline(versionInfo) {
  const changes = []

  for (const fontConfig of FONT_FAMILIES) {
    const manifestFamily = versionInfo.fonts[fontConfig.name]
    const filenames = manifestFamily.hashes.map(({ filename }) => filename).toSorted()
    const expected = fontConfig.woff2.toSorted()
    if (JSON.stringify(filenames) !== JSON.stringify(expected)) {
      changes.push(
        `${fontConfig.name}: expected [${expected.join(", ")}], got [${filenames.join(", ")}]`,
      )
    }
  }

  return changes
}

export async function validateFontAssets({
  cssPath,
  fontsDir,
  requireBaseline = false,
  requireFullHashes = true,
  versionPath,
}) {
  const [css, versionText] = await Promise.all([
    readFile(cssPath, "utf8"),
    readFile(versionPath, "utf8"),
  ])
  const versionInfo = JSON.parse(versionText)
  const configuredNames = FONT_FAMILIES.map(({ name }) => name)

  assertSameMembers(Object.keys(versionInfo.fonts ?? {}), configuredNames, "Manifest font families")
  if (
    typeof versionInfo.lastUpdate !== "string" ||
    !Number.isFinite(Date.parse(versionInfo.lastUpdate)) ||
    new Date(versionInfo.lastUpdate).toISOString() !== versionInfo.lastUpdate
  ) {
    throw new TypeError("Manifest lastUpdate must be a canonical ISO timestamp")
  }

  const cssRoot = postcss.parse(css, { from: cssPath })
  const cssRootsByFamily = new Map(configuredNames.map((name) => [name, postcss.root()]))
  for (const node of cssRoot.nodes) {
    if (node.type === "comment") {
      continue
    }
    if (node.type !== "atrule" || node.name.toLowerCase() !== "font-face" || !node.nodes) {
      throw new Error(`Unexpected CSS node in ${cssPath}: ${node.type} ${node.name ?? ""}`)
    }

    const family = unquote(readRequiredDeclaration(node, "font-family").value)
    const familyRoot = cssRootsByFamily.get(family)
    if (!familyRoot) {
      throw new Error(`Unexpected font family in ${cssPath}: ${family}`)
    }
    familyRoot.append(node.clone())
  }

  let totalBytes = 0
  let totalFiles = 0

  for (const fontConfig of FONT_FAMILIES) {
    const manifestFamily = versionInfo.fonts[fontConfig.name]
    if (manifestFamily.dir !== fontConfig.dir) {
      throw new Error(
        `${fontConfig.name} manifest directory is ${manifestFamily.dir}, expected ${fontConfig.dir}`,
      )
    }
    if (
      !Array.isArray(manifestFamily.hashes) ||
      manifestFamily.files !== manifestFamily.hashes.length
    ) {
      throw new Error(`${fontConfig.name} manifest file count is inconsistent`)
    }
    if (
      manifestFamily.files < FONT_LIMITS.familyFilesMin ||
      manifestFamily.files > FONT_LIMITS.familyFilesMax
    ) {
      throw new Error(
        `${fontConfig.name} has ${manifestFamily.files} files outside the allowed range`,
      )
    }

    const fontDir = join(fontsDir, fontConfig.dir)
    const directoryFiles = await readdir(fontDir)
    const actualWoff2 = directoryFiles.filter((filename) => filename.endsWith(".woff2"))
    const actualTtf = directoryFiles.filter((filename) => filename.endsWith(".ttf"))
    const unexpected = directoryFiles.filter(
      (filename) => !filename.endsWith(".woff2") && !filename.endsWith(".ttf"),
    )
    if (unexpected.length > 0) {
      throw new Error(
        `${fontConfig.name} directory contains unexpected files: ${unexpected.join(", ")}`,
      )
    }

    const manifestFilenames = manifestFamily.hashes.map(({ filename }) => filename)
    assertSameMembers(actualWoff2, manifestFilenames, `${fontConfig.name} WOFF2 files`)
    assertSameMembers(
      actualTtf,
      fontConfig.ttf.map(({ filename }) => filename),
      `${fontConfig.name} immutable TTF files`,
    )

    for (const entry of fontConfig.ttf) {
      if (!SAFE_TTF_FILENAME.test(entry.filename) || !/^[a-f0-9]{64}$/.test(entry.hash)) {
        throw new Error(`${fontConfig.name} has an invalid immutable TTF baseline entry`)
      }

      const filePath = join(fontDir, entry.filename)
      const fileStats = await lstat(filePath)
      if (!fileStats.isFile()) {
        throw new Error(`${fontConfig.name}/${entry.filename} is not a regular file`)
      }
      if (fileStats.size < FONT_LIMITS.fontBytesMin || fileStats.size > FONT_LIMITS.ttfBytesMax) {
        throw new Error(
          `${fontConfig.name}/${entry.filename} is ${fileStats.size} bytes, outside TTF limits`,
        )
      }

      const buffer = await readFile(filePath)
      validateFontWithParser(buffer, entry.filename)
      if (calculateHash(buffer) !== entry.hash) {
        throw new Error(
          `${fontConfig.name}/${entry.filename} does not match its immutable baseline hash`,
        )
      }
    }

    const cssFilenames = parseLocalFontCss(
      cssRootsByFamily.get(fontConfig.name).toString(),
      fontConfig,
      `${cssPath} (${fontConfig.name})`,
    )
    assertSameMembers(cssFilenames, manifestFilenames, `${fontConfig.name} CSS references`)

    const seenManifestFiles = new Set()
    let familyBytes = 0
    for (const entry of manifestFamily.hashes) {
      if (!SAFE_FONT_FILENAME.test(entry.filename) || seenManifestFiles.has(entry.filename)) {
        throw new Error(
          `${fontConfig.name} manifest has an unsafe or duplicate filename: ${entry.filename}`,
        )
      }
      seenManifestFiles.add(entry.filename)
      if (
        typeof entry.hash !== "string" ||
        !/^[a-f0-9]+$/.test(entry.hash) ||
        (requireFullHashes && entry.hash.length !== 64)
      ) {
        throw new Error(`${fontConfig.name}/${entry.filename} has an invalid SHA-256 hash`)
      }

      const filePath = join(fontDir, entry.filename)
      const fileStats = await lstat(filePath)
      if (!fileStats.isFile()) {
        throw new Error(`${fontConfig.name}/${entry.filename} is not a regular file`)
      }
      if (fileStats.size < FONT_LIMITS.fontBytesMin || fileStats.size > FONT_LIMITS.fontBytesMax) {
        throw new Error(
          `${fontConfig.name}/${entry.filename} is ${fileStats.size} bytes, outside limits`,
        )
      }
      const buffer = await readFile(filePath)
      inspectWoff2(buffer)
      validateFontWithParser(buffer, entry.filename)
      const actualHash = calculateHash(buffer)
      if (actualHash !== entry.hash) {
        throw new Error(`${fontConfig.name}/${entry.filename} does not match its manifest hash`)
      }

      familyBytes += fileStats.size
    }

    if (familyBytes > FONT_LIMITS.familyBytes) {
      throw new Error(`${fontConfig.name} totals ${familyBytes} bytes, exceeding its limit`)
    }
    totalBytes += familyBytes
    totalFiles += manifestFamily.files
  }

  if (totalFiles < FONT_LIMITS.totalFilesMin || totalFiles > FONT_LIMITS.totalFilesMax) {
    throw new Error(`Total WOFF2 count ${totalFiles} is outside limits`)
  }
  if (totalBytes > FONT_LIMITS.totalBytes) {
    throw new Error(`Total WOFF2 size ${totalBytes} exceeds its limit`)
  }

  const structuralChanges = compareWithBaseline(versionInfo)
  if (requireBaseline && structuralChanges.length > 0) {
    throw new Error(
      `Font structure differs from the reviewed baseline:\n${structuralChanges.join("\n")}`,
    )
  }

  return { structuralChanges, totalBytes, totalFiles, versionInfo }
}
