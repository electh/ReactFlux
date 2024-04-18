import { useSetAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";

export const useConfig = () => {
  const setConfig = useSetAtom(configAtom);

  const updateConfig = (config) => {
    setConfig((prev) => ({ ...prev, ...config }));
  };

  return { updateConfig };
};
