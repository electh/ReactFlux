export const getHostname = (url) => {
  const pattern = /^(?:http|https):\/\/((?!(\d+\.){3}\d+)([^/]+))/;
  const match = url.match(pattern);
  if (match) {
    return match[1];
  }
  return null;
};
