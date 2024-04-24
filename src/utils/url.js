export const getBaseUrl = (fullUrl) => {
  const parsedUrl = new URL(fullUrl);
  return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
};
