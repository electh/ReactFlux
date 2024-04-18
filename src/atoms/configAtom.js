import { atomWithLocalStorage } from "../utils/atom";
import { defaultConfig } from "../utils/config";

export const configAtom = atomWithLocalStorage("config", defaultConfig);
