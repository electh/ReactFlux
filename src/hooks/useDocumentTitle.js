import { useStore } from "@nanostores/react"
import { useEffect } from "react"
import { useParams } from "react-router"

import { polyglotState } from "@/hooks/useLanguage"
import { contentState } from "@/store/contentState"
import { catalogCategoriesState, catalogFeedsState } from "@/store/dataState"

const BASE_TITLE = "ReactFlux"

const useDocumentTitle = () => {
  const { activeContent, infoFrom } = useStore(contentState, {
    keys: ["activeContent", "infoFrom"],
  })
  const { polyglot } = useStore(polyglotState)
  const { id } = useParams()
  const feeds = useStore(catalogFeedsState)
  const categories = useStore(catalogCategoriesState)

  useEffect(() => {
    const getTitle = () => {
      if (activeContent?.title) {
        return activeContent.title
      }

      if (id) {
        if (infoFrom === "category") {
          return categories.find((c) => c.id === Number(id))?.title
        }
        if (infoFrom === "feed") {
          return feeds.find((f) => f.id === Number(id))?.title
        }
      }

      const pathToKey = {
        all: "sidebar.all",
        starred: "sidebar.starred",
        history: "sidebar.history",
        today: "sidebar.today",
      }

      const translationKey = pathToKey[infoFrom]
      return translationKey ? polyglot.t(translationKey) : ""
    }

    const title = getTitle()
    document.title = title ? `${title} - ${BASE_TITLE}` : BASE_TITLE
  }, [activeContent, infoFrom, id, feeds, categories, polyglot])
}

export default useDocumentTitle
