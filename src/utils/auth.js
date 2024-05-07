import isURL from "validator/lib/isURL";

export const getAuth = () => {
  return JSON.parse(localStorage.getItem("auth")) ?? {};
};

export const isValidAuth = (auth) => {
  const { server, token, username, password } = auth;
  if (!server || !isURL(server, { require_protocol: true })) {
    return false;
  }
  return token || (username && password);
};
