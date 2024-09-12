import { persistentAtom } from "@nanostores/persistent";

const defaultValue = {
  server: "",
  token: "",
  username: "",
  password: "",
};

export const authState = persistentAtom("auth", defaultValue, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const setAuth = (authChanges) => authState.set(authChanges);

export const resetAuth = () => setAuth(defaultValue);
