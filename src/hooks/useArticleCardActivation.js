import { Message } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useCallback, useMemo } from "react"
import { useHref, useLocation } from "react-router"

import { markEntriesAsRead } from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import { settingsState } from "@/store/settingsState"
import { buildEntryDetailPath, extractBasePath, getSafeExternalUrl } from "@/utils/url"

const isModifiedActivation = (event) =>
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey

const useArticleCardActivation = (handleEntryClick) => {
  const { polyglot } = useStore(polyglotState)
  const { markReadBy, openSourceOnCardClick } = useStore(settingsState, {
    keys: ["markReadBy", "openSourceOnCardClick"],
  })
  const location = useLocation()
  const basePath = extractBasePath(location.pathname)
  const baseHref = useHref(basePath).replace(/\/$/, "")

  const scheduleMarkAsReadOnView = useCallback(
    (entry) => {
      globalThis.setTimeout(() => {
        if (markReadBy === "view") {
          markEntriesAsRead([entry])
        }
      }, 0)
    },
    [markReadBy],
  )

  const getPrimaryLinkProps = useCallback(
    (entry) => {
      const detailHref = buildEntryDetailPath(baseHref, entry.id)
      const sourceHref = getSafeExternalUrl(entry.url)
      const opensSourceExternally = openSourceOnCardClick && sourceHref !== null
      const fallsBackToDetail = openSourceOnCardClick && sourceHref === null

      const notifyInvalidSourceFallback = () => {
        Message.error(polyglot.t("article_card.invalid_source_link_fallback"))
      }

      const handleClick = (event) => {
        if (event.defaultPrevented) {
          return
        }

        if (opensSourceExternally) {
          scheduleMarkAsReadOnView(entry)
          return
        }

        if (fallsBackToDetail) {
          notifyInvalidSourceFallback()
        }

        if (isModifiedActivation(event)) {
          scheduleMarkAsReadOnView(entry)
          return
        }

        event.preventDefault()
        handleEntryClick(entry)
      }

      const handleAuxClick = (event) => {
        if (event.defaultPrevented || event.button !== 1) {
          return
        }

        if (fallsBackToDetail) {
          notifyInvalidSourceFallback()
        }
        scheduleMarkAsReadOnView(entry)
      }

      return {
        href: opensSourceExternally ? sourceHref : detailHref,
        onAuxClick: handleAuxClick,
        onClick: handleClick,
        ...(opensSourceExternally && { rel: "noopener", target: "_blank" }),
      }
    },
    [baseHref, handleEntryClick, openSourceOnCardClick, polyglot, scheduleMarkAsReadOnView],
  )

  return useMemo(
    () => ({
      getPrimaryLinkProps,
      openInReactFlux: handleEntryClick,
      opensSourceOnCardClick: openSourceOnCardClick,
    }),
    [getPrimaryLinkProps, handleEntryClick, openSourceOnCardClick],
  )
}

export default useArticleCardActivation
