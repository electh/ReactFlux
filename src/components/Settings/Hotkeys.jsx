import { Table } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage";
import { hotkeysState } from "../../store/hotkeysState";
import EditableTagGroup from "./EditableTagGroup";

const Hotkeys = () => {
  const { polyglot } = useStore(polyglotState);
  const hotkeys = useStore(hotkeysState);

  const hotkeyActions = [
    "navigateToPreviousArticle",
    "navigateToPreviousUnreadArticle",
    "navigateToNextArticle",
    "navigateToNextUnreadArticle",
    "openLinkExternally",
    "toggleReadStatus",
    "fetchOriginalArticle",
    "toggleStarStatus",
    "saveToThirdPartyServices",
    "openPhotoSlider",
    "exitDetailView",
    "showHotkeysSettings",
  ];

  const columns = [
    {
      title: polyglot.t("hotkeys.key"),
      dataIndex: "keys",
      render: (keys, record) => (
        <EditableTagGroup keys={keys} record={record} />
      ),
    },
    {
      title: polyglot.t("hotkeys.function"),
      dataIndex: "description",
    },
  ];

  const hotkeysMapping = hotkeyActions.map((action) => ({
    action,
    key: action,
    keys: hotkeys[action],
    description: polyglot.t(`hotkeys.${action}`),
  }));

  return (
    <Table
      borderCell={true}
      columns={columns}
      data={hotkeysMapping}
      pagination={false}
      size="small"
      style={{ margin: "0 auto", width: "90%" }}
    />
  );
};

export default Hotkeys;
