import { create } from "zustand";
import { getConfig } from "../utils/config";

const useConfigStore = create((set) => ({
  color: getConfig("color") || "Blue",
  titleSize: getConfig("titleSize") || 3,
  contentSize: getConfig("contentSize") || 1.05,
  layout: getConfig("layout") || "expensive",
  align: getConfig("align") || "justify",
  setColor: (value) => {
    set({ color: value });
  },
  setLayout: (value) => {
    set({ layout: value });
  },
  setTitleSize: (value) => {
    set({ titleSize: value });
  },
  setContentSize: (value) => {
    set({ contentSize: value });
  },
  setAlign: (value) => {
    set({ align: value });
  },
}));

export { useConfigStore };
