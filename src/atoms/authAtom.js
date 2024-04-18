import { atomWithLocalStorage } from "../utils/atom";

export const authAtom = atomWithLocalStorage("auth", {
  server: "",
  token: "",
  username: "",
  password: "",
});
