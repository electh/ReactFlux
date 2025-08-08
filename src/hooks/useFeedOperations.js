import { Message, Modal, Notification } from "@arco-design/web-react"

import { deleteFeed, getFeedEntries, refreshFeed } from "@/apis"
import { markFeedAsRead as markFeedAsReadAPI } from "@/apis/feeds"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setEntries } from "@/store/contentState"
import { setFeedsData, setUnreadInfo } from "@/store/dataState"
import { getUTCDate } from "@/utils/date"

export const updateFeedStatus = (feed, isSuccessful, targetFeedId = null) => {
  if (targetFeedId === null || targetFeedId === feed.id) {
    return {
      ...feed,
      parsing_error_count: isSuccessful ? 0 : feed.parsing_error_count + 1,
      checked_at: getUTCDate(),
    }
  }
  return feed
}

export const handleFeedRefresh = async (
  refreshFunc,
  feedUpdater,
  displayMessage = true,
  useNotification = false,
) => {
  const { polyglot } = polyglotState.get()

  const showMessage = (message, type = "success") => {
    if (useNotification) {
      Notification[type]({ title: message })
    } else {
      Message[type](message)
    }
  }

  try {
    const response = await refreshFunc()
    const isSuccessful = response.status === 204

    if (displayMessage) {
      const message = isSuccessful
        ? polyglot.t("feed_table.refresh_success")
        : polyglot.t("feed_table.refresh_error")
      showMessage(message, isSuccessful ? "success" : "error")
    }

    setFeedsData((feeds) => feeds.map((feed) => feedUpdater(feed, isSuccessful)))
    return isSuccessful
  } catch (error) {
    console.error("Failed to refresh feed: ", error)
    if (displayMessage) {
      showMessage(polyglot.t("feed_table.refresh_error"), "error")
    }
    setFeedsData((feeds) => feeds.map((feed) => feedUpdater(feed, false)))
    return false
  }
}

export const useFeedOperations = (useNotification = false) => {
  const { polyglot } = polyglotState.get()
  const { infoFrom, infoId } = contentState.get()

  const showMessage = (message, type = "success") => {
    if (useNotification) {
      Notification[type]({ title: message })
    } else {
      Message[type](message)
    }
  }

  const refreshSingleFeed = async (feed, displayMessage = true) => {
    const feedId = feed.id || feed.key
    return handleFeedRefresh(
      () => refreshFeed(feedId),
      (feed, isSuccessful) => updateFeedStatus(feed, isSuccessful, feedId),
      displayMessage,
      useNotification,
    )
  }

  const deleteFeedDirectly = async (feed) => {
    try {
      const response = await deleteFeed(feed.id || feed.key)
      if (response.status === 204) {
        setFeedsData((feeds) => feeds.filter((f) => f.id !== (feed.id || feed.key)))
        const successMessage = polyglot.t("feed_table.remove_feed_success", { title: feed.title })
        showMessage(successMessage)
      } else {
        throw new Error(`Unexpected status: ${response.status}`)
      }
    } catch (error) {
      console.error(`Failed to delete feed: ${feed.title}`, error)
      const errorMessage = polyglot.t("feed_table.remove_feed_error", { title: feed.title })
      showMessage(errorMessage, "error")
    }
  }

  const handleDeleteFeed = async (feed) => {
    try {
      const starredEntries = await getFeedEntries(feed.id || feed.key, null, true)
      if (starredEntries.total > 0) {
        Modal.confirm({
          title: polyglot.t("feed_table.remove_feed_confirm_title"),
          content: polyglot.t("feed_table.remove_feed_confirm_content", {
            count: starredEntries.total,
          }),
          onOk: () => deleteFeedDirectly(feed),
        })
      } else {
        const confirmTitle = polyglot.t("feed_table.remove_feed_confirm_title")
        const confirmContent = polyglot.t("feed_table.table_feed_remove_confirm", {
          title: feed.title,
        })

        Modal.confirm({
          title: confirmTitle,
          content: confirmContent,
          onOk: () => deleteFeedDirectly(feed),
        })
      }
    } catch (error) {
      console.error("Failed to check starred entries:", error)
      const errorMessage = polyglot.t("feed_table.check_starred_error")
      showMessage(errorMessage, "error")
    }
  }

  const markFeedAsRead = async (feed) => {
    try {
      await markFeedAsReadAPI(feed.id)

      setUnreadInfo((prevUnreadInfo) => ({
        ...prevUnreadInfo,
        [feed.id]: 0,
      }))

      if (infoFrom === "feed" && feed.id === Number(infoId)) {
        setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })))
      }

      const successMessage = polyglot.t("article_list.mark_all_as_read_success")
      showMessage(successMessage)
    } catch (error) {
      console.error("Failed to mark feed as read:", error)
      const errorMessage = polyglot.t("article_list.mark_all_as_read_error")
      showMessage(errorMessage, "error")
    }
  }

  return {
    refreshSingleFeed,
    deleteFeedDirectly,
    handleDeleteFeed,
    markFeedAsRead,
    updateFeedStatus,
  }
}
