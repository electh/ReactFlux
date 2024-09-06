import { persistentAtom } from "@nanostores/persistent";

const defaultAuth = {
  server: "",
  token: "",
  username: "",
  password: "",
};

export const authState = persistentAtom("auth", defaultAuth, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const setAuth = (authChanges) => authState.set(authChanges);

export const resetAuth = () => setAuth(defaultAuth);
