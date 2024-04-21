import { atom, useAtom } from "jotai";

const activeContentAtom = atom(null);

export const useActiveContent = () => {
  const [activeContent, setActiveContent] = useAtom(activeContentAtom);

  return { activeContent, setActiveContent };
};
