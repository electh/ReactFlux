import { useAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";

export const useConfigAtom = () => {
  const [config, setConfig] = useAtom(configAtom);

  const updateConfig = (newSettings) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...newSettings }));
  };

  return { config, updateConfig };
};
