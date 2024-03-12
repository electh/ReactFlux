import { Message } from "@arco-design/web-react";
import Content from "./components/Content";
import { thunder } from "./apis/axios";

export default function History() {
  const getEntries = async (offset = 0) => {
    const url = `/v1/entries?order=changed_at&direction=desc&status=read&offset=${offset}`;

    try {
      return await thunder.request({ method: "get", url });
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
  };

  return <Content info={{ from: "history", id: "" }} getEntries={getEntries} />;
}
