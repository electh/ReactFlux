const extractProtocolAndHostname = (url) => {
  const urlObj = new URL(url);
  return `${urlObj.protocol}//${urlObj.hostname}`;
};

export { extractProtocolAndHostname };
