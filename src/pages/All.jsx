import { getAllEntries, markAllAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const All = () => (
  <Content
    getEntries={getAllEntries}
    info={{ from: "all", id: "" }}
    markAllAsRead={markAllAsRead}
  />
)

export default All
