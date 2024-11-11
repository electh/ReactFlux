import { getStarredEntries } from "@/apis"
import Content from "@/components/Content/Content"

const Starred = () => <Content getEntries={getStarredEntries} info={{ from: "starred", id: "" }} />

export default Starred
