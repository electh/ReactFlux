import { getTodayEntries, updateEntriesStatus } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getTodayEntries(status, filterParams)

const Today = () => {
  const markTodayAsRead = async () => {
    const unreadResponse = await getTodayEntries("unread")
    const unreadCount = unreadResponse.total
    let unreadEntries = unreadResponse.entries

    if (unreadCount > unreadEntries.length) {
      unreadEntries = getTodayEntries("unread", { limit: unreadCount }).then(
        (response) => response.entries,
      )
    }

    const unreadEntryIds = unreadEntries.map((entry) => entry.id)
    return updateEntriesStatus(unreadEntryIds, "read")
  }

  return (
    <Content
      getEntries={getEntries}
      info={{ from: "today", id: "" }}
      markAllAsRead={markTodayAsRead}
    />
  )
}

export default Today
