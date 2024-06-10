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
    description: "Exit the article view and return to the list.",
  },
  {
    key: "2",
    keyName: "←",
    description: "Navigate to the previous article in the list.",
  },
  {
    key: "3",
    keyName: "Ctrl + ←",
    description: "Navigate to the previous unread article in the list.",
  },
  {
    key: "4",
    keyName: "→",
    description: "Navigate to the next article in the list.",
  },
  {
    key: "5",
    keyName: "Ctrl + →",
    description: "Navigate to the next unread article in the list.",
  },
  {
    key: "6",
    keyName: "B",
    description: "Open the current article's link in a new browser tab.",
  },
  {
    key: "7",
    keyName: "D",
    description:
      "Fetch and display the original content of the current article.",
  },
  {
    key: "8",
    keyName: "M",
    description: "Toggle the read status of the current article.",
  },
  {
    key: "9",
    keyName: "S",
    description: "Toggle the star status (bookmark) of the current article.",
  },
  {
    key: "10",
    keyName: "V",
    description:
      "Open the photo slider for viewing all images in the current article.",
  },
];

const Hotkeys = () => (
  <Table
    borderCell={true}
    columns={columns}
    data={hotkeysData}
    pagination={false}
    size="small"
    style={{ margin: "0 auto", width: "90%" }}
  />
);

export default Hotkeys;
