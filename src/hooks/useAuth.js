import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const auth = atomWithStorage("auth", {
  server: "",
  token: "",
  username: "",
  password: "",
});

export const useAuth = () => useAtom(auth);
