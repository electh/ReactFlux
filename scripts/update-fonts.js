import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const { dirname, join } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, "..")
const FONTS_DIR = join(PROJECT_ROOT, "public", "fonts")
const STYLES_DIR = join(PROJECT_ROOT, "public", "styles")
const FONTS_CSS = join(STYLES_DIR, "fonts.css")
const VERSION_FILE = join(FONTS_DIR, "version.json")

const GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// Font families configuration
const FONT_FAMILIES = [
  {
    name: "Fira Sans",
    dir: "fira-sans",
    weights: [400],
    styles: ["normal"],
  },
  {
    name: "Noto Sans",
    dir: "noto-sans",
    weights: [400],
    styles: ["normal"],
  },
  {
    name: "Noto Serif",
    dir: "noto-serif",
    weights: [400],
    styles: ["normal"],
  },
  {
    name: "Open Sans",
    dir: "open-sans",
    weights: [400],
    styles: ["normal"],
  },
  {
    name: "Source Sans Pro",
    dir: "source-sans-pro",
    weights: [400],
    styles: ["normal"],
  },
  {
    name: "Source Serif Pro",
    dir: "source-serif-pro",
    weights: [400],
    styles: ["normal"],
  },
]

/**
 * Calculate SHA-256 hash of buffer
 * @param {ArrayBuffer | Buffer} buffer - Data to hash
 * @returns {string} Truncated hash string
 */
function calculateHash(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex").slice(0, 16)
}

/**
 * Build Google Fonts API URL
 * @param {string} fontFamily - Font family name
 * @param {number[]} weights - Font weights
 * @param {string[]} styles - Font styles
 * @returns {string} Google Fonts API URL
 */
function buildGoogleFontsURL(fontFamily, weights, styles) {
  const familyParam = fontFamily.replaceAll(" ", "+")

  const styleSpecs = weights.flatMap((weight) =>
    styles.map((style) => (style === "italic" ? `1,${weight}` : `${weight}`)),
  )

  return `${GOOGLE_FONTS_API}?family=${familyParam}:wght@${styleSpecs.join(";")}&display=swap`
}

/**
 * Extract filename from URL
 * @param {string} url - Font file URL
 * @returns {string} Filename
 */
function extractFilename(url) {
  return url.split("/").pop().split("?")[0]
}

/**
 * Log progress message
 * @param {number} current - Current index
 * @param {number} total - Total count
 * @param {string} message - Message to log
 */
function logProgress(current, total, message) {
  console.log(`  [${current}/${total}] ${message}`)
}

/**
 * Fetch Google Fonts CSS
 * @param {string} fontFamily - Font family name
 * @param {number[]} weights - Font weights
 * @param {string[]} styles - Font styles
 * @returns {Promise<string>} CSS content
 */
async function fetchGoogleFontsCSS(fontFamily, weights, styles) {
  const url = buildGoogleFontsURL(fontFamily, weights, styles)

  console.log(`Fetching CSS for ${fontFamily}...`)

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } })

  if (!response.ok) {
    throw new Error(`Failed to fetch CSS for ${fontFamily}: ${response.statusText}`)
  }

  return response.text()
}

/**
 * Parse @font-face blocks from CSS
 * @param {string} css - CSS content
 * @returns {Array<{css: string, url: string}>} Parsed font faces
 */
function parseFontCSS(css) {
  const fontFaceRegex = /@font-face\s*\{[^}]+}/g
  const urlRegex = /url\(([^)]+)\)/
  const fontFaces = css.match(fontFaceRegex) || []

  return fontFaces
    .map((fontFace) => {
      const urlMatch = fontFace.match(urlRegex)
      return urlMatch ? { css: fontFace, url: urlMatch[1] } : null
    })
    .filter(Boolean)
}

/**
 * Download font file from URL
 * @param {string} url - Font file URL
 * @param {string} outputPath - Local output path
 * @returns {Promise<ArrayBuffer>} Downloaded file buffer
 */
async function downloadFont(url, outputPath) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download font from ${url}: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  await writeFile(outputPath, Buffer.from(buffer))

  return buffer
}

/**
 * Process and download a single font file
 * @param {Object} font - Font metadata
 * @param {string} fontDir - Font directory path
 * @param {string} dirName - Directory name for URL path
 * @param {number} index - Current index
 * @param {number} total - Total count
 * @returns {Promise<{css: string, filename: string, hash: string} | null>}
 */
async function processFontFile(font, fontDir, dirName, index, total) {
  const { url, css } = font
  const filename = extractFilename(url)
  const outputPath = join(fontDir, filename)

  logProgress(index + 1, total, `Downloading ${filename}...`)

  try {
    const buffer = await downloadFont(url, outputPath)
    const hash = calculateHash(buffer)
    const localPath = `/fonts/${dirName}/${filename}`
    const updatedCSS = css.replace(url, localPath)

    return { css: updatedCSS, filename, hash }
  } catch (error) {
    console.error(`  Failed to download ${filename}:`, error.message)
    return null
  }
}

/**
 * Clean old font files from directory
 * @param {string} fontDir - Font directory path
 * @param {string[]} currentFilenames - List of current filenames to keep
 */
async function cleanFontDirectory(fontDir, currentFilenames) {
  if (!existsSync(fontDir)) {
    return
  }

  try {
    const existingFiles = await readdir(fontDir)
    const filesToDelete = existingFiles.filter(
      (file) => file.endsWith(".woff2") && !currentFilenames.includes(file),
    )

    if (filesToDelete.length > 0) {
      console.log(`  Cleaning ${filesToDelete.length} old font file(s)...`)

      for (const file of filesToDelete) {
        await rm(join(fontDir, file))
        console.log(`  ✓ Deleted: ${file}`)
      }
    }
  } catch (error) {
    console.error(`  Failed to clean directory:`, error.message)
  }
}

/**
 * Update a single font family
 * @param {Object} fontConfig - Font configuration
 * @returns {Promise<{name: string, css: string, hashes: Array}>}
 */
async function updateFontFamily(fontConfig) {
  const { name, dir, weights, styles } = fontConfig

  console.log(`\n=== Updating ${name} ===`)

  // Fetch and parse CSS
  const css = await fetchGoogleFontsCSS(name, weights, styles)
  const fonts = parseFontCSS(css)

  console.log(`Found ${fonts.length} font file(s)`)

  // Ensure font directory exists
  const fontDir = join(FONTS_DIR, dir)
  await mkdir(fontDir, { recursive: true })

  // Download all font files
  const downloadPromises = fonts.map((font, index) =>
    processFontFile(font, fontDir, dir, index, fonts.length),
  )

  const results = await Promise.all(downloadPromises)
  const successfulDownloads = results.filter(Boolean)

  // Extract data from successful downloads
  const downloadedCSS = successfulDownloads.map((result) => result.css)
  const fontHashes = successfulDownloads.map(({ filename, hash }) => ({
    filename,
    hash,
  }))
  const filenames = successfulDownloads.map((result) => result.filename)

  // Clean old files
  await cleanFontDirectory(fontDir, filenames)

  return {
    name,
    css: downloadedCSS.join("\n"),
    hashes: fontHashes,
  }
}

/**
 * Check if fonts have changed compared to version file
 * @param {Object} newVersionInfo - New version information
 * @returns {Promise<boolean>} True if changes detected
 */
async function checkForChanges(newVersionInfo) {
  try {
    if (!existsSync(VERSION_FILE)) {
      return true
    }

    const oldContent = await readFile(VERSION_FILE, "utf8")
    const oldVersionInfo = JSON.parse(oldContent)

    // Check each font family for changes
    for (const [fontName, fontData] of Object.entries(newVersionInfo.fonts)) {
      const oldFontData = oldVersionInfo.fonts[fontName]

      // New font family
      if (!oldFontData) {
        console.log(`\n⚠ New font detected: ${fontName}`)
        return true
      }

      // File count changed
      if (oldFontData.files !== fontData.files) {
        console.log(
          `\n⚠ File count changed for ${fontName}: ${oldFontData.files} → ${fontData.files}`,
        )
        return true
      }

      // Check individual file hashes
      const hasHashChanges = fontData.hashes.some((newHash) => {
        const oldHash = oldFontData.hashes.find((h) => h.filename === newHash.filename)
        return !oldHash || oldHash.hash !== newHash.hash
      })

      if (hasHashChanges) {
        console.log(`\n⚠ Font files changed for ${fontName}`)
        return true
      }
    }

    console.log("\n✓ No changes detected")
    return false
  } catch (error) {
    console.error("❌ Error checking for changes:", error.message)
    return true
  }
}

/**
 * Build version information object
 * @param {Array<Object>} results - Update results
 * @param {Array<Object>} fontConfigs - Font configurations
 * @returns {Object} Version information
 */
function buildVersionInfo(results, fontConfigs) {
  const versionInfo = {
    lastUpdate: new Date().toISOString(),
    fonts: {},
  }

  for (const [index, result] of results.entries()) {
    const fontConfig = fontConfigs[index]
    versionInfo.fonts[fontConfig.name] = {
      dir: fontConfig.dir,
      files: result.hashes.length,
      hashes: result.hashes,
    }
  }

  return versionInfo
}

/**
 * Update all fonts
 * @returns {Promise<boolean>} True if changes were made
 */
async function updateFonts() {
  console.log("Starting font update process...\n")

  // Update each font family
  const results = []

  for (const fontConfig of FONT_FAMILIES) {
    try {
      const result = await updateFontFamily(fontConfig)
      results.push(result)
    } catch (error) {
      console.error(`Failed to update ${fontConfig.name}:`, error.message)
      // Continue with other fonts even if one fails
      results.push({ name: fontConfig.name, css: "", hashes: [] })
    }
  }

  // Generate version information
  const versionInfo = buildVersionInfo(results, FONT_FAMILIES)

  // Check for changes
  const hasChanges = await checkForChanges(versionInfo)

  // Write combined CSS file
  console.log("\n=== Generating fonts.css ===")
  const cssContent = results.map((result) => result.css).join("\n")
  await writeFile(FONTS_CSS, cssContent, "utf8")
  console.log(`✓ Written to ${FONTS_CSS}`)

  // Save version information
  if (hasChanges) {
    await writeFile(VERSION_FILE, JSON.stringify(versionInfo, null, 2), "utf8")
    console.log(`✓ Version info saved to ${VERSION_FILE}`)
  }

  // Print summary
  console.log("\n=== Update Complete ===")
  console.log(`Updated ${results.length} font family(s)`)

  const totalFiles = Object.values(versionInfo.fonts).reduce((sum, font) => sum + font.files, 0)
  console.log(`Total font files: ${totalFiles}`)

  return hasChanges
}

try {
  const hasChanges = await updateFonts()
  const message = hasChanges ? "\n✓ Fonts have been updated!" : "\n✓ Fonts are up to date!"
  console.log(message)
  process.exit(0)
} catch (error) {
  console.error("\n✗ Update failed:", error)
  process.exit(1)
}
