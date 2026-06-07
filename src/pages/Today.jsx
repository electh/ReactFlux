import { getTodayEntries, updateEntriesStatus } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getTodayEntries(status, filterParams)
const info = { from: "today", id: "" }

const MAX_ENTRIES_PER_REQUEST = 1000

const markTodayAsRead = async () => {
  const firstResponse = await getTodayEntries("unread")
  const unreadCount = firstResponse.total
  let unreadEntries = firstResponse.entries

  // Miniflux caps `limit` at 1000, so page through the results with offset.
  while (unreadEntries.length < unreadCount) {
    const response = await getTodayEntries("unread", {
      limit: MAX_ENTRIES_PER_REQUEST,
      offset: unreadEntries.length,
    })
    if (response.entries.length === 0) {
      break
    }
    unreadEntries = [...unreadEntries, ...response.entries]
  }

  const unreadEntryIds = unreadEntries.map((entry) => entry.id)
  return updateEntriesStatus(unreadEntryIds, "read")
}

const Today = () => {
  return <Content getEntries={getEntries} info={info} markAllAsRead={markTodayAsRead} />
}

export default Today
