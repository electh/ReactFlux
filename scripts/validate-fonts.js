import { execFile } from "node:child_process"
import { appendFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { FONT_FAMILIES, validateFontAssets } from "./font-assets.js"

const execFileAsync = promisify(execFile)
const { dirname, join, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const PROJECT_ROOT = join(dirname(__filename), "..")
const FONTS_DIR = join(PROJECT_ROOT, "public", "fonts")
const FONTS_CSS = join(PROJECT_ROOT, "public", "styles", "fonts.css")
const VERSION_FILE = join(FONTS_DIR, "version.json")
const FONT_DIRECTORIES = new Set(FONT_FAMILIES.map(({ dir }) => dir))

function isAllowedFontUpdatePath(filename) {
  if (filename === "public/fonts/version.json" || filename === "public/styles/fonts.css") {
    return true
  }

  const match = filename.match(/^public\/fonts\/([^/]+)\/([^/]+\.woff2)$/)
  return Boolean(match && FONT_DIRECTORIES.has(match[1]))
}

export function validatePullRequestDiff(diffOutput) {
  if (!diffOutput.trim()) {
    throw new Error("Font update pull request has no changed files")
  }

  const changedFiles = new Set()
  for (const line of diffOutput.trim().split("\n")) {
    const [status, ...paths] = line.split("\t")
    const filenames = status.startsWith("R") || status.startsWith("C") ? paths : paths.slice(0, 1)
    for (const filename of filenames) {
      if (!isAllowedFontUpdatePath(filename)) {
        throw new Error(`Font update contains a forbidden path: ${filename}`)
      }
      changedFiles.add(filename)
    }
  }

  if (!changedFiles.has("public/fonts/version.json")) {
    throw new Error("Font update must include version.json")
  }

  return [...changedFiles].toSorted()
}

async function validateGitDiff(baseRef) {
  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-status", "--find-renames", `${baseRef}...HEAD`, "--"],
    { cwd: PROJECT_ROOT, maxBuffer: 1024 * 1024 },
  )
  return validatePullRequestDiff(stdout)
}

async function validateWorkingTreeDiff() {
  const [{ stdout: tracked }, { stdout: untracked }] = await Promise.all([
    execFileAsync("git", ["diff", "--name-status", "--find-renames", "HEAD", "--"], {
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024,
    }),
    execFileAsync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024,
    }),
  ])
  const untrackedEntries = untracked
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((filename) => `A\t${filename}`)
    .join("\n")
  return validatePullRequestDiff([tracked.trim(), untrackedEntries].filter(Boolean).join("\n"))
}

function parseArguments(arguments_) {
  const options = {
    allowStructuralChange: false,
    baseRef: null,
    githubOutput: process.env.GITHUB_OUTPUT ?? null,
    workingTree: false,
  }

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    switch (argument) {
      case "--allow-structural-change": {
        options.allowStructuralChange = true
        break
      }
      case "--base-ref": {
        options.baseRef = arguments_[index + 1]
        if (!options.baseRef) {
          throw new Error("--base-ref requires a value")
        }
        index += 1
        break
      }
      case "--github-output": {
        options.githubOutput = arguments_[index + 1]
        if (!options.githubOutput) {
          throw new Error("--github-output requires a value")
        }
        index += 1
        break
      }
      case "--working-tree": {
        options.workingTree = true
        break
      }
      default: {
        throw new Error(`Unknown argument: ${argument}`)
      }
    }
  }

  if (options.baseRef && options.workingTree) {
    throw new Error("--base-ref and --working-tree are mutually exclusive")
  }

  return options
}

async function writeOutputs(filename, validation, changedFiles) {
  if (!filename) {
    return
  }
  await appendFile(
    filename,
    [
      `structural_change=${validation.structuralChanges.length > 0}`,
      `total_bytes=${validation.totalBytes}`,
      `total_files=${validation.totalFiles}`,
      `changed_files=${changedFiles.length}`,
      "",
    ].join("\n"),
  )
}

export async function validateRepositoryFonts({
  allowStructuralChange = false,
  baseRef = null,
  githubOutput = null,
  workingTree = false,
} = {}) {
  const validation = await validateFontAssets({
    cssPath: FONTS_CSS,
    fontsDir: FONTS_DIR,
    requireBaseline: !allowStructuralChange,
    versionPath: VERSION_FILE,
  })
  let changedFiles = []
  if (workingTree) {
    changedFiles = await validateWorkingTreeDiff()
  } else if (baseRef) {
    changedFiles = await validateGitDiff(baseRef)
  }

  await writeOutputs(githubOutput, validation, changedFiles)
  return { ...validation, changedFiles }
}

if (resolve(process.argv[1] ?? "") === __filename) {
  try {
    const options = parseArguments(process.argv.slice(2))
    const result = await validateRepositoryFonts(options)
    console.log(
      `✓ Validated ${result.totalFiles} WOFF2 files (${result.totalBytes} bytes) against the reviewed baseline`,
    )
    if (result.changedFiles.length > 0) {
      console.log(`✓ Validated ${result.changedFiles.length} changed paths`)
    }
  } catch (error) {
    console.error("✗ Font validation failed:", error)
    process.exitCode = 1
  }
}
