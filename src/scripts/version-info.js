// TODO: Adjust this script to work with the new CI/CD pipeline
import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"

const versionInfo = {
  gitHash: execSync("git rev-parse --short HEAD").toString().trim(),
  gitDate: execSync("git log -1 --format=%cd --date=iso").toString().trim(),
}

writeFileSync("src/version-info.json", JSON.stringify(versionInfo, null, 2))
