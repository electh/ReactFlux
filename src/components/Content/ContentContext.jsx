import { Message } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { createContext, useContext, useRef } from "react";
import { updateEntriesStatus } from "../../apis";
import useEntryActions from "../../hooks/useEntryActions";
import { polyglotState } from "../../hooks/useLanguage";
import {
  setActiveContent,
  setIsArticleLoading,
} from "../../store/contentState";

const Context = createContext();

export const ContextProvider = ({ children }) => {
  const polyglot = useStore(polyglotState);

  const entryDetailRef = useRef(null);
  const entryListRef = useRef(null);

  const { handleEntryStatusUpdate } = useEntryActions();

  const handleEntryClick = async (entry) => {
    setIsArticleLoading(true);

    setActiveContent({ ...entry, status: "read" });
    setTimeout(() => {
      const articleContent = entryDetailRef.current;
      if (articleContent) {
        const contentWrapper = articleContent.querySelector(
          ".simplebar-content-wrapper",
        );
        if (contentWrapper) {
          contentWrapper.scroll({ top: 0 });
        }
        articleContent.focus();
      }

      setIsArticleLoading(false);
      if (entry.status === "unread") {
        handleEntryStatusUpdate(entry, "read");
        updateEntriesStatus([entry.id], "read").catch(() => {
          Message.error(polyglot.t("content.mark_as_read_error"));
          setActiveContent({ ...entry, status: "unread" });
          handleEntryStatusUpdate(entry, "unread");
        });
      }
    }, 200);
  };

  const value = {
    entryDetailRef,
    entryListRef,
    handleEntryClick,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useContentContext = () => useContext(Context);
