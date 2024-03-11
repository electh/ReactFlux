import { Table, Tag } from "@arco-design/web-react";

const columns = [
  {
    title: "Key",
    dataIndex: "name",
    render: (col) => <Tag>{col}</Tag>,
  },
  {
    title: "Function",
    dataIndex: "function",
  },
];
const data = [
  {
    key: "1",
    name: "Esc",
    function: "Dismiss article",
  },
  {
    key: "2",
    name: "←",
    function: "Previous article",
  },
  {
    key: "3",
    name: "→",
    function: "Next article",
  },
  {
    key: "4",
    name: "M",
    function: "Mark as read / unread",
  },
  {
    key: "5",
    name: "S",
    function: "Star / Unstar",
  },
];

export default function Shortcuts() {
  return (
    <Table columns={columns} data={data} pagination={false} size={"small"} />
  );
}
