import { atom, useAtom } from "jotai";

const collapsedAtom = atom(window.innerWidth <= 992);
const isLgAtom = atom(window.innerWidth > 992);

export const useCollapsed = () => {
  const [collapsed, setCollapsed] = useAtom(collapsedAtom);
  const [isLg] = useAtom(isLgAtom);
  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  return { collapsed, toggleCollapsed, isLg };
};
