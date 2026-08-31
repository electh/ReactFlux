import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import process from "node:process"

const readGitValue = (...args) => {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

const firstEnvironmentValue = (...names) => {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) {
      return value
    }
  }

  return null
}

const normalizeDate = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const dateFromSourceEpoch = () => {
  const sourceEpoch = process.env.SOURCE_DATE_EPOCH?.trim()
  if (!sourceEpoch) {
    return null
  }

  const timestamp = Number(sourceEpoch)
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    return null
  }

  const date = new Date(timestamp * 1000)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const gitHash =
  readGitValue("rev-parse", "--short", "HEAD") ??
  firstEnvironmentValue(
    "SOURCE_COMMIT",
    "GITHUB_SHA",
    "CF_PAGES_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "COMMIT",
  )?.slice(0, 8) ??
  "unknown"

const gitDate =
  normalizeDate(readGitValue("log", "-1", "--format=%cI")) ??
  normalizeDate(process.env.SOURCE_COMMIT_DATE?.trim()) ??
  dateFromSourceEpoch()

if (gitHash === "unknown") {
  console.warn("Commit hash unavailable; using 'unknown' for this build.")
}

if (!gitDate) {
  console.warn("Commit date unavailable; update checks will be disabled for this build.")
}

const versionInfo = { gitHash, gitDate }
const outputPath = new URL("../version-info.json", import.meta.url)

writeFileSync(outputPath, `${JSON.stringify(versionInfo, null, 2)}\n`)
