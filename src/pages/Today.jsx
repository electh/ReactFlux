import { getTodayEntries, markEntriesAsReadInBatches } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getTodayEntries(status, filterParams)

const markTodayAsRead = () => markEntriesAsReadInBatches(getTodayEntries)

const Today = () => {
  return (
    <Content
      getEntries={getEntries}
      info={{ from: "today", id: "" }}
      markAllAsRead={markTodayAsRead}
    />
  )
}

export default Today
