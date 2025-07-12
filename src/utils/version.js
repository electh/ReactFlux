const compareVersions = (version1, version2) => {
  const versionParts1 = version1.split(".")
  const versionParts2 = version2.split(".")

  for (let i = 0; i < Math.max(versionParts1.length, versionParts2.length); i++) {
    const part1 = parseInt(versionParts1[i] || "0", 10)
    const part2 = parseInt(versionParts2[i] || "0", 10)

    if (part1 !== part2) {
      return part1 < part2 ? -1 : 1
    }
  }

  return 0
}

export default compareVersions
