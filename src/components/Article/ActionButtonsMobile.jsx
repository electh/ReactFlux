import { Button } from "@arco-design/web-react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconClose,
  IconCloudDownload,
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import React from "react";

import useStore from "../../Store";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";

const ActionButtonsMobile = ({
  handleEntryClick,
  getEntries,
  isFilteredEntriesUpdated,
  setIsFilteredEntriesUpdated,
}) => {
  const activeContent = useStore((state) => state.activeContent);
  const { handleFetchContent, handleToggleStarred, handleToggleStatus } =
    useEntryActions();
  const { handleLeftKey, handleRightKey, handleEscapeKey } = useKeyHandlers(
    handleEntryClick,
    getEntries,
    isFilteredEntriesUpdated,
    setIsFilteredEntriesUpdated,
  );

  if (!activeContent) {
    return null;
  }

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;

  return (
    <Button.Group
      className="action-buttons-mobile"
      style={{
        display: "none",
        justifyContent: "center",
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        boxShadow: "0 4px 10px rgba(var(--primary-6), 0.4)",
      }}
    >
      <Button
        type="primary"
        shape="round"
        onClick={handleEscapeKey}
        icon={<IconClose />}
      />
      <Button
        type="primary"
        onClick={handleToggleStatus}
        icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
      />
      <Button
        type="primary"
        onClick={handleToggleStarred}
        icon={
          isStarred ? (
            <IconStarFill style={{ color: "#ffcd00" }} />
          ) : (
            <IconStar />
          )
        }
      />
      <Button
        type="primary"
        onClick={() => handleFetchContent()}
        icon={<IconCloudDownload />}
      />
      <Button type="primary" onClick={handleLeftKey} icon={<IconArrowLeft />} />
      <Button
        type="primary"
        shape="round"
        onClick={handleRightKey}
        icon={<IconArrowRight />}
      />
    </Button.Group>
  );
};

export default ActionButtonsMobile;
