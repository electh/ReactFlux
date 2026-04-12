import { spawnSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"

const DEFAULT_REMOTE = "origin"
const DEFAULT_BRANCH = "build"
const DEFAULT_SOURCE_DIR = "build"
const DEFAULT_AUTHOR_NAME = "ReloadedFlux build bot"
const DEFAULT_AUTHOR_EMAIL = "41898282+github-actions[bot]@users.noreply.github.com"

const shouldSkipDeploy = () => {
  const rawValue = process.env.SKIP_BUILD_BRANCH_DEPLOY

  if (typeof rawValue === "string") {
    const normalizedValue = rawValue.trim().toLowerCase()
    return ["1", "true", "yes", "on"].includes(normalizedValue)
  }

  return Boolean(process.env.CI || process.env.GITHUB_ACTIONS)
}

const runGit = ({ args, cwd, allowFailure = false }) => {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })

  if (result.status !== 0 && !allowFailure) {
    const stderr = result.stderr.trim()
    const stdout = result.stdout.trim()
    const details = stderr || stdout || `git ${args.join(" ")} failed`
    throw new Error(details)
  }

  return result
}

const getGitOutput = ({ args, cwd, allowFailure = false }) =>
  runGit({ args, cwd, allowFailure }).stdout.trim()

const isTruthyExitCode = (result) => result.status === 0

const removeDirectoryContents = async (directoryPath) => {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.name !== ".git")
      .map((entry) =>
        fs.rm(path.join(directoryPath, entry.name), { force: true, recursive: true }),
      ),
  )
}

const copyDirectoryContents = async ({ from, to }) => {
  const entries = await fs.readdir(from, { withFileTypes: true })

  await Promise.all(
    entries.map((entry) =>
      fs.cp(path.join(from, entry.name), path.join(to, entry.name), {
        force: true,
        recursive: true,
      }),
    ),
  )
}

const main = async () => {
  if (shouldSkipDeploy()) {
    console.info("[build-deploy] Skipping build branch deploy")
    return
  }

  const repoRoot = getGitOutput({
    args: ["rev-parse", "--show-toplevel"],
    cwd: process.cwd(),
  })

  const remote = process.env.BUILD_BRANCH_DEPLOY_REMOTE || DEFAULT_REMOTE
  const branch = process.env.BUILD_BRANCH_DEPLOY_BRANCH || DEFAULT_BRANCH
  const sourceDir = path.resolve(
    repoRoot,
    process.env.BUILD_BRANCH_DEPLOY_SOURCE_DIR || DEFAULT_SOURCE_DIR,
  )

  await fs.access(sourceDir)

  const originUrl = getGitOutput({
    args: ["remote", "get-url", remote],
    cwd: repoRoot,
  })
  const currentBranch = getGitOutput({
    args: ["rev-parse", "--abbrev-ref", "HEAD"],
    cwd: repoRoot,
  })
  const shortHash = getGitOutput({
    args: ["rev-parse", "--short", "HEAD"],
    cwd: repoRoot,
  })
  const authorName =
    process.env.BUILD_BRANCH_DEPLOY_AUTHOR_NAME ||
    getGitOutput({
      args: ["config", "--get", "user.name"],
      cwd: repoRoot,
      allowFailure: true,
    }) ||
    DEFAULT_AUTHOR_NAME
  const authorEmail =
    process.env.BUILD_BRANCH_DEPLOY_AUTHOR_EMAIL ||
    getGitOutput({
      args: ["config", "--get", "user.email"],
      cwd: repoRoot,
      allowFailure: true,
    }) ||
    DEFAULT_AUTHOR_EMAIL
  const commitMessage =
    process.env.BUILD_BRANCH_DEPLOY_MESSAGE || `Deploy build from ${currentBranch}@${shortHash}`

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "reloadedflux-build-deploy-"))

  try {
    runGit({
      args: ["init", "--initial-branch", branch],
      cwd: tempDirectory,
    })
    runGit({
      args: ["remote", "add", remote, originUrl],
      cwd: tempDirectory,
    })

    const remoteBranchExists = isTruthyExitCode(
      runGit({
        args: ["ls-remote", "--exit-code", "--heads", remote, branch],
        cwd: tempDirectory,
        allowFailure: true,
      }),
    )

    if (remoteBranchExists) {
      runGit({
        args: ["fetch", "--depth", "1", remote, branch],
        cwd: tempDirectory,
      })
      runGit({
        args: ["checkout", "-B", branch, "FETCH_HEAD"],
        cwd: tempDirectory,
      })
    } else {
      runGit({
        args: ["checkout", "--orphan", branch],
        cwd: tempDirectory,
      })
    }

    await removeDirectoryContents(tempDirectory)
    await copyDirectoryContents({ from: sourceDir, to: tempDirectory })

    runGit({
      args: ["add", "--all"],
      cwd: tempDirectory,
    })

    const hasChanges = !isTruthyExitCode(
      runGit({
        args: ["diff", "--cached", "--quiet"],
        cwd: tempDirectory,
        allowFailure: true,
      }),
    )

    if (!hasChanges) {
      console.info(`[build-deploy] No changes to publish to ${remote}/${branch}`)
      return
    }

    runGit({
      args: ["config", "user.name", authorName],
      cwd: tempDirectory,
    })
    runGit({
      args: ["config", "user.email", authorEmail],
      cwd: tempDirectory,
    })
    runGit({
      args: ["commit", "-m", commitMessage],
      cwd: tempDirectory,
    })
    runGit({
      args: ["push", remote, `HEAD:${branch}`],
      cwd: tempDirectory,
    })

    console.info(`[build-deploy] Published ${sourceDir} to ${remote}/${branch}`)
  } finally {
    await fs.rm(tempDirectory, { force: true, recursive: true })
  }
}

try {
  await main()
} catch (error) {
  console.error("[build-deploy] Failed to publish build branch")
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
