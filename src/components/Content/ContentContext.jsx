import { Message } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { createContext, useCallback, useMemo, useRef } from "react"
import { useLocation, useNavigate } from "react-router"

import { updateEntriesStatusOptimistically } from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import { setActiveContent } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { buildEntryDetailPath, extractBasePath, isEntryDetailPath } from "@/utils/url"

const Context = createContext()

const scheduleAfterNextPaint = (callback) => {
  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(() => globalThis.setTimeout(callback, 0))
  } else {
    globalThis.setTimeout(callback, 0)
  }
}

export const ContextProvider = ({ children }) => {
  const { polyglot } = useStore(polyglotState)
  const { markReadBy } = useStore(settingsState, { keys: ["markReadBy"] })

  const entryDetailRef = useRef(null)
  const entryListRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const closeActiveContent = useCallback(() => {
    setActiveContent(null)

    const currentPath = location.pathname
    const basePath = extractBasePath(currentPath)

    if (isEntryDetailPath(currentPath) && basePath) {
      navigate(basePath)
    }
  }, [location.pathname, navigate])

  const handleEntryClick = useCallback(
    (entry) => {
      const shouldAutoMarkAsRead = markReadBy === "view"
      const updatedEntry = shouldAutoMarkAsRead ? { ...entry, status: "read" } : { ...entry }

      setActiveContent(updatedEntry)

      const currentPath = location.pathname
      const basePath = extractBasePath(currentPath)
      const entryDetailPath = buildEntryDetailPath(basePath, entry.id)

      navigate(entryDetailPath)

      scheduleAfterNextPaint(() => {
        const articleContent = entryDetailRef.current
        if (articleContent) {
          const contentWrapper = articleContent.querySelector(
            ".simplebar-content-wrapper, .scroll-container",
          )
          contentWrapper?.scroll({ top: 0 })
          articleContent.focus()
        }
      })

      if (shouldAutoMarkAsRead && entry.status === "unread") {
        void updateEntriesStatusOptimistically([entry], "read", () => {
          Message.error(polyglot.t("content.mark_as_read_error"))
        })
      }
    },
    [polyglot, markReadBy, location.pathname, navigate],
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
