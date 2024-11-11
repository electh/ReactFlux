import CustomTooltip from "@/components/ui/CustomTooltip.jsx";
import { polyglotState } from "@/hooks/useLanguage.js";
import { useModalToggle } from "@/hooks/useModalToggle.js";
import { Button } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";

export default function AddFeed() {
  const { setAddFeedModalVisible } = useModalToggle();
  const { polyglot } = useStore(polyglotState);

  return (
    <CustomTooltip content={polyglot.t("sidebar.add_feed")} mini>
      <Button
        shape="circle"
        size="small"
        icon={<IconPlus />}
        style={{ marginTop: "1em", marginBottom: "0.5em" }}
        onClick={() => setAddFeedModalVisible(true)}
      />
    </CustomTooltip>
  );
}
