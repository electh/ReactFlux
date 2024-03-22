const getAuth = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  if (!auth) {
    console.log("No auth info found in localStorage");
    return null;
  }
  return auth;
};

const setAuth = (method, secret) => {
  const auth = { method: method, secret: secret };
  localStorage.setItem("auth", JSON.stringify(auth));
};

export { getAuth, setAuth };
