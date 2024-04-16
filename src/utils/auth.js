export const getAuth = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  return auth || {};
};

export const isValidAuth = (auth) => {
  const { server, token, username, password } = auth;
  return server && (token || (username && password));
};
