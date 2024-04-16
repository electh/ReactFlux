import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { defaultConfig } from "../utils/config";

export const configAtom = atomWithStorage("config", defaultConfig);

export const useConfig = () => {
  const [config, setConfig] = useAtom(configAtom);

  const updateConfig = (newConfig) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...newConfig }));
  };

  return { config, updateConfig };
};
