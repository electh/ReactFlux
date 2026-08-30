const NUMERIC_VERSION_PATTERN = /^\d+(?:\.\d+)*$/

const parseVersion = (version) => {
  if (typeof version !== "string" || !NUMERIC_VERSION_PATTERN.test(version)) {
    throw new TypeError("Version must contain only dot-separated numeric segments")
  }

  return version.split(".").map(Number)
}

const compareVersions = (version1, version2) => {
  const versionParts1 = parseVersion(version1)
  const versionParts2 = parseVersion(version2)

  for (let index = 0; index < Math.max(versionParts1.length, versionParts2.length); index++) {
    const part1 = versionParts1[index] ?? 0
    const part2 = versionParts2[index] ?? 0

    if (part1 !== part2) {
      return part1 < part2 ? -1 : 1
    }
  }

  return 0
}

export default compareVersions
