import {
  getAllEntries,
  markAllAsRead as markAllUserEntriesAsRead,
  markEntriesAsReadInBatches,
} from "@/apis"
import Content from "@/components/Content/Content"
import { isEntryScopeFullyVisible } from "@/store/dataState"

const getEntries = (status, _starred, filterParams) => getAllEntries(status, filterParams)

const markAllAsRead = () =>
  isEntryScopeFullyVisible("global")
    ? markAllUserEntriesAsRead()
    : markEntriesAsReadInBatches(getAllEntries)

const All = () => (
  <Content getEntries={getEntries} info={{ from: "all", id: "" }} markAllAsRead={markAllAsRead} />
)

export default All
