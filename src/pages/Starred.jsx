import { getStarredEntries } from "../apis";
import Content from "../components/Content/Content";

const Starred = () => (
  <Content info={{ from: "starred", id: "" }} getEntries={getStarredEntries} />
);

export default Starred;
