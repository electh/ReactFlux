const compareVersions = (version1, version2) => {
  const versionParts1 = version1.split(".")
  const versionParts2 = version2.split(".")

  for (let index = 0; index < Math.max(versionParts1.length, versionParts2.length); index++) {
    const part1 = Number.parseInt(versionParts1[index] || "0", 10)
    const part2 = Number.parseInt(versionParts2[index] || "0", 10)

    if (part1 !== part2) {
      return part1 < part2 ? -1 : 1
    }
  }

  return 0
}

export const parseBuildVersion = (buildVersion) => {
  if (typeof buildVersion !== "string") {
    return null
  }

  const normalizedBuildVersion = buildVersion.trim()
  const match = normalizedBuildVersion.match(/^(\d{8})\.(\d+)$/)

  if (!match) {
    return null
  }

  const [, datePart, sequencePart] = match
  return {
    datePart,
    sequencePart: Number.parseInt(sequencePart, 10),
  }
}

export const compareBuildVersions = (version1, version2) => {
  const parsedVersion1 = parseBuildVersion(version1)
  const parsedVersion2 = parseBuildVersion(version2)

  if (!parsedVersion1 || !parsedVersion2) {
    return null
  }

  if (parsedVersion1.datePart !== parsedVersion2.datePart) {
    return parsedVersion1.datePart < parsedVersion2.datePart ? -1 : 1
  }

  if (parsedVersion1.sequencePart !== parsedVersion2.sequencePart) {
    return parsedVersion1.sequencePart < parsedVersion2.sequencePart ? -1 : 1
  }

  return 0
}

export default compareVersions
