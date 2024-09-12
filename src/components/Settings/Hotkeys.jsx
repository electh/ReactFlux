import { Table, Tag } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage";

const Hotkeys = () => {
  const { polyglot } = useStore(polyglotState);

  const columns = [
    {
      title: polyglot.t("hotkeys.key"),
      dataIndex: "keyName",
      render: (keyName) => <Tag>{keyName}</Tag>,
    },
    {
      title: polyglot.t("hotkeys.function"),
      dataIndex: "description",
    },
  ];

  const hotkeysData = [
    {
      key: "1",
      keyName: "Esc",
      description: polyglot.t("hotkeys.esc"),
    },
    {
      key: "2",
      keyName: "←",
      description: polyglot.t("hotkeys.left"),
    },
    {
      key: "3",
      keyName: "Ctrl + ←",
      description: polyglot.t("hotkeys.ctrl_left"),
    },
    {
      key: "4",
      keyName: "→",
      description: polyglot.t("hotkeys.right"),
    },
    {
      key: "5",
      keyName: "Ctrl + →",
      description: polyglot.t("hotkeys.ctrl_right"),
    },
    {
      key: "6",
      keyName: "B",
      description: polyglot.t("hotkeys.b"),
    },
    {
      key: "7",
      keyName: "D",
      description: polyglot.t("hotkeys.d"),
    },
    {
      key: "8",
      keyName: "M",
      description: polyglot.t("hotkeys.m"),
    },
    {
      key: "9",
      keyName: "S",
      description: polyglot.t("hotkeys.s"),
    },
    {
      key: "10",
      keyName: "V",
      description: polyglot.t("hotkeys.v"),
    },
  ];

  return (
    <Table
      borderCell={true}
      columns={columns}
      data={hotkeysData}
      pagination={false}
      size="small"
      style={{ margin: "0 auto", width: "90%" }}
    />
  );
};

export default Hotkeys;
