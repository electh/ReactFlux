import { proxy, subscribe } from "valtio";

const defaultAuth = {
  server: "",
  token: "",
  username: "",
  password: "",
};

export const authState = proxy(
  JSON.parse(localStorage.getItem("auth")) || defaultAuth,
);

export const setAuth = (authChanges) => {
  Object.assign(authState, authChanges);
};

export const resetAuth = () => setAuth(defaultAuth);

subscribe(authState, () => {
  localStorage.setItem("auth", JSON.stringify(authState));
});
