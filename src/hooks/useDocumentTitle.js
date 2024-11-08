import { useStore } from "@nanostores/react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { contentState } from "../store/contentState";
import { categoriesState, feedsState } from "../store/dataState";
import { polyglotState } from "./useLanguage";

const BASE_TITLE = "ReactFlux";

export function useDocumentTitle() {
  const { activeContent, infoFrom } = useStore(contentState);
  const { polyglot } = useStore(polyglotState);
  const { id } = useParams();
  const feeds = useStore(feedsState);
  const categories = useStore(categoriesState);

  useEffect(() => {
    const getTitle = () => {
      if (activeContent?.title) {
        return activeContent.title;
      }

      if (id) {
        if (infoFrom === "category") {
          return categories.find((c) => c.id === Number(id))?.title;
        }
        if (infoFrom === "feed") {
          return feeds.find((f) => f.id === Number(id))?.title;
        }
      }

      const pathToKey = {
        all: "sidebar.all",
        starred: "sidebar.starred",
        history: "sidebar.history",
        today: "sidebar.today",
      };

      const translationKey = pathToKey[infoFrom];
      return translationKey ? polyglot.t(translationKey) : "";
    };

    const title = getTitle();
    document.title = title ? `${title} - ${BASE_TITLE}` : BASE_TITLE;
  }, [activeContent, infoFrom, id, feeds, categories, polyglot]);
}
