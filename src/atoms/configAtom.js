import { atomWithStorage } from "jotai/utils";
import { defaultConfig } from "../utils/config.js";

export const configAtom = atomWithStorage("config", defaultConfig);
