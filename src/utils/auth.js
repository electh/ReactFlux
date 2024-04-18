export const getAuth = () => {
  return JSON.parse(localStorage.getItem("auth")) ?? {};
};

export const isValidAuth = (auth) => {
  const { server, token, username, password } = auth;
  return server && (token || (username && password));
};
