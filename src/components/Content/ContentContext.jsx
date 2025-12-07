import { Message } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { createContext, useCallback, useMemo, useRef } from "react"
import { useLocation, useNavigate } from "react-router"

import { updateEntriesStatus } from "@/apis"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import { setActiveContent, setIsArticleLoading } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { buildEntryDetailPath, extractBasePath, isEntryDetailPath } from "@/utils/url"

const Context = createContext()

export const ContextProvider = ({ children }) => {
  const { polyglot } = useStore(polyglotState)
  const { markReadBy } = useStore(settingsState)

  const entryDetailRef = useRef(null)
  const entryListRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const { handleEntryStatusUpdate } = useEntryActions()

  const closeActiveContent = useCallback(() => {
    setActiveContent(null)

    const currentPath = location.pathname
    const basePath = extractBasePath(currentPath)

    if (isEntryDetailPath(currentPath) && basePath) {
      navigate(basePath)
    }
  }, [location.pathname, navigate])

  const handleEntryClick = useCallback(
    async (entry) => {
      setIsArticleLoading(true)

      const shouldAutoMarkAsRead = markReadBy === "view"
      const updatedEntry = shouldAutoMarkAsRead ? { ...entry, status: "read" } : { ...entry }

      setActiveContent(updatedEntry)

      const currentPath = location.pathname
      const basePath = extractBasePath(currentPath)
      const entryDetailPath = buildEntryDetailPath(basePath, entry.id)

      navigate(entryDetailPath)

      setTimeout(() => {
        const articleContent = entryDetailRef.current
        if (articleContent) {
          const contentWrapper = articleContent.querySelector(".simplebar-content-wrapper")
          if (contentWrapper) {
            contentWrapper.scroll({ top: 0 })
          }
          articleContent.focus()
        }

        setIsArticleLoading(false)
        if (shouldAutoMarkAsRead && entry.status === "unread") {
          handleEntryStatusUpdate(entry, "read")
          updateEntriesStatus([entry.id], "read").catch(() => {
            Message.error(polyglot.t("content.mark_as_read_error"))
            setActiveContent({ ...entry, status: "unread" })
            handleEntryStatusUpdate(entry, "unread")
          })
        }
      }, ANIMATION_DURATION_MS)
    },
    [polyglot, handleEntryStatusUpdate, markReadBy, location.pathname, navigate],
  )

  const value = useMemo(
    () => ({
      entryDetailRef,
      entryListRef,
      handleEntryClick,
      setActiveContent,
      closeActiveContent,
    }),
    [handleEntryClick, closeActiveContent],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const ContentContext = Context
