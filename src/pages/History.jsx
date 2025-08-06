import { getHistoryEntries } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (_status, _starred, filterParams) => getHistoryEntries(filterParams)

const History = () => <Content getEntries={getEntries} info={{ from: "history", id: "" }} />

export default History
