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

export default compareVersions
