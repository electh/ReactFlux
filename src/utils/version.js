export const compareVersions = (version1, version2) => {
  const versionParts1 = version1.split(".");
  const versionParts2 = version2.split(".");

  for (
    let i = 0;
    i < Math.max(versionParts1.length, versionParts2.length);
    i++
  ) {
    const part1 = versionParts1[i] || "0";
    const part2 = versionParts2[i] || "0";

    const comparison = part1.localeCompare(part2, undefined, { numeric: true });
    if (comparison !== 0) {
      return comparison;
    }
  }

  return 0;
};
