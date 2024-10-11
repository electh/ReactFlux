import { Table, Tag } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage";
import { getHotkeys } from "../../store/hotkeysState";

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

  const processKeyName = (keys) =>
    keys
      .map((key) => key.replace("left", "⏴").replace("right", "⏵"))
      .join(" / ");

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
  ];

  const hotkeysMapping = hotkeyActions.map((action, index) => ({
    key: index,
    keyName: processKeyName(getHotkeys(action)),
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
