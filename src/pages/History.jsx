import { getHistoryEntries } from "@/apis"
import Content from "@/components/Content/Content"

const History = () => <Content getEntries={getHistoryEntries} info={{ from: "history", id: "" }} />

export default History
