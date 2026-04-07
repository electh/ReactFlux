import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const DEFAULT_BUILD_CHANNEL = "main"
const DEFAULT_BUILD_TIMEZONE = "UTC"
const VERSION_OUTPUT_PATHS = ["src/version-info.json", "public/version-info.json"]

export const safeExec = (command) => {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

const toInteger = (value) => {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) ? parsedValue : null
}

export const normalizeBuildDate = (value) => {
  if (typeof value !== "string") {
    return null
  }

  const normalizedValue = value.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : null
}

export const formatBuildVersion = (buildDate, buildSequence) => {
  if (!normalizeBuildDate(buildDate) || !Number.isInteger(buildSequence) || buildSequence < 0) {
    return null
  }

  const compactDate = buildDate.replaceAll("-", "")
  return `${compactDate}.${String(buildSequence).padStart(2, "0")}`
}

const getCurrentUtcBuildDate = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_BUILD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(new Date())
  const year = parts.find(({ type }) => type === "year")?.value
  const month = parts.find(({ type }) => type === "month")?.value
  const day = parts.find(({ type }) => type === "day")?.value

  return year && month && day ? `${year}-${month}-${day}` : null
}

const getGitCommitDate = () =>
  safeExec("git log -1 --format=%cd --date=iso-strict") ?? new Date().toISOString()

const getGitBranch = () => safeExec("git rev-parse --abbrev-ref HEAD") ?? "unknown"

const getBuildSequenceFromGitHistory = (buildDate) => {
  if (!normalizeBuildDate(buildDate)) {
    return 0
  }

  const commitCount = safeExec(`git rev-list --count --since="${buildDate}T00:00:00Z" HEAD`)
  return toInteger(commitCount) ?? 0
}

export const createVersionInfo = (environment = process.env) => {
  const gitHash = safeExec("git rev-parse --short HEAD") ?? "dev"
  const gitCommitDate = getGitCommitDate()
  const gitDate = gitCommitDate
  const gitBranch = environment.VERSION_GIT_BRANCH || environment.GITHUB_REF_NAME || getGitBranch()
  const channel =
    environment.VERSION_CHANNEL ||
    (gitBranch === DEFAULT_BUILD_CHANNEL ? DEFAULT_BUILD_CHANNEL : gitBranch)

  const configuredBuildDate = normalizeBuildDate(environment.VERSION_BUILD_DATE)
  const fallbackBuildDate =
    normalizeBuildDate(gitCommitDate.slice(0, 10)) ?? getCurrentUtcBuildDate() ?? "1970-01-01"
  const buildDate = configuredBuildDate ?? fallbackBuildDate

  const configuredBuildSequence = toInteger(environment.VERSION_BUILD_SEQUENCE)
  const buildSequence = configuredBuildSequence ?? getBuildSequenceFromGitHistory(buildDate) ?? 0
  const buildVersion = formatBuildVersion(buildDate, buildSequence)
  const isCanonical = environment.VERSION_IS_CANONICAL === "true"

  return {
    buildVersion,
    buildDate,
    buildSequence,
    channel,
    gitBranch,
    gitHash,
    gitCommitDate,
    gitDate,
    isCanonical,
  }
}

const writeVersionInfo = (versionInfo) => {
  const versionInfoJson = JSON.stringify(versionInfo, null, 2)

  for (const outputPath of VERSION_OUTPUT_PATHS) {
    writeFileSync(outputPath, versionInfoJson)
  }
}

const isExecutedDirectly = () => {
  if (!process.argv[1]) {
    return false
  }

  return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isExecutedDirectly()) {
  writeVersionInfo(createVersionInfo())
}
