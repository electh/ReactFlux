import { getStarredEntries, markEntriesAsReadInBatches, markStarredEntriesAsRead } from "@/apis"
import Content from "@/components/Content/Content"
import { isEntryScopeFullyVisible } from "@/store/dataState"

const getEntries = (status, _starred, filterParams) => getStarredEntries(status, filterParams)
const markAllAsRead = () =>
  isEntryScopeFullyVisible("global")
    ? markStarredEntriesAsRead()
    : markEntriesAsReadInBatches(getStarredEntries)

const Starred = () => (
  <Content
    getEntries={getEntries}
    info={{ from: "starred", id: "" }}
    markAllAsRead={markAllAsRead}
  />
)

export default Starred
