import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"

const { dirname, join, resolve } = path

const isInsideGitRepository = (startDirectory) => {
  let currentDirectory = resolve(startDirectory)

  while (!existsSync(join(currentDirectory, ".git"))) {
    const parentDirectory = dirname(currentDirectory)
    if (parentDirectory === currentDirectory) {
      return false
    }

    currentDirectory = parentDirectory
  }

  return true
}

if (isInsideGitRepository(process.cwd())) {
  const require = createRequire(import.meta.url)
  const lefthookCli = require.resolve("lefthook")

  execFileSync(process.execPath, [lefthookCli, "install"], { stdio: "inherit" })
} else {
  console.info("Skipping Lefthook installation: no Git repository found.")
}
