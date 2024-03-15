import { Table, Tag } from "@arco-design/web-react";

const columns = [
  {
    title: "Key",
    dataIndex: "keyName",
    render: (keyName) => <Tag>{keyName}</Tag>,
  },
  {
    title: "Function",
    dataIndex: "description",
  },
];
const hotkeysData = [
  {
    key: "1",
    keyName: "Esc",
    description: "Dismiss article",
  },
  {
    key: "2",
    keyName: "←",
    description: "Previous article",
  },
  {
    key: "3",
    keyName: "→",
    description: "Next article",
  },
  {
    key: "4",
    keyName: "B",
    description: "Open link externally",
  },
  {
    key: "5",
    keyName: "M",
    description: "Mark as read / unread",
  },
  {
    key: "6",
    keyName: "S",
    description: "Star / Unstar",
  },
];

export default function Hotkeys() {
  return (
    <Table
      columns={columns}
      data={hotkeysData}
      pagination={false}
      size="small"
    />
  );
}
