import { Button, Message } from "@arco-design/web-react";
import { IconEye, IconEyeInvisible } from "@arco-design/web-react/icon";

import { useStore } from "@nanostores/react";
import { polyglotState } from "../../hooks/useLanguage.js";
import { settingsState, updateSettings } from "../../store/settingsState.js";
import CustomTooltip from "../ui/CustomTooltip.jsx";

const FeedDisplayToggle = () => {
  const { showAllFeeds } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const handleToggleFeedsVisibility = () => {
    updateSettings({ showAllFeeds: !showAllFeeds });
    Message.success(
      showAllFeeds
        ? polyglot.t("header.hide_some_feeds")
        : polyglot.t("header.show_all_feeds"),
    );
  };

  return (
    <CustomTooltip
      content={
        showAllFeeds
          ? polyglot.t("header.hide_some_feeds")
          : polyglot.t("header.show_all_feeds")
      }
      mini
    >
      <Button
        shape="circle"
        size="mini"
        icon={showAllFeeds ? <IconEyeInvisible /> : <IconEye />}
        style={{ marginTop: "1em", marginBottom: "0.5em" }}
        onClick={handleToggleFeedsVisibility}
      />
    </CustomTooltip>
  );
};

export default FeedDisplayToggle;
