import { getAllEntries, markAllAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getAllEntries(status, filterParams)

const All = () => (
  <Content getEntries={getEntries} info={{ from: "all", id: "" }} markAllAsRead={markAllAsRead} />
)

export default All
