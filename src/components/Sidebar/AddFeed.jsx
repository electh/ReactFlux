import { Button } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage.js";
import { useModalToggle } from "../../hooks/useModalToggle.js";
import CustomTooltip from "../ui/CustomTooltip.jsx";

export default function AddFeed() {
  const { setAddFeedModalVisible } = useModalToggle();
  const { polyglot } = useStore(polyglotState);
  return (
    <CustomTooltip content={polyglot.t("header.add_feed")} mini>
      <Button
        shape="circle"
        size="mini"
        icon={<IconPlus />}
        style={{ marginTop: "1em", marginBottom: "0.5em", marginRight: 8 }}
        onClick={() => setAddFeedModalVisible(true)}
      />
    </CustomTooltip>
  );
}
