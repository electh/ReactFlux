import { getStarredEntries } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getStarredEntries(status, filterParams)

const Starred = () => <Content getEntries={getEntries} info={{ from: "starred", id: "" }} />

export default Starred
