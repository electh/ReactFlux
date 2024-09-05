import isURL from "validator/lib/isURL";

const isValidDockerURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    const { hostname, port } = parsedUrl;
    return !!hostname && !!port;
  } catch (e) {
    return false;
  }
};

export const isValidAuth = (auth) => {
  const { server, token, username, password } = auth;
  if (
    !server ||
    (!isURL(server, { require_protocol: true }) && !isValidDockerURL(server))
  ) {
    return false;
  }
  return token || (username && password);
};
