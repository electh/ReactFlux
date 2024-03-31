import { Button, Space, Tooltip } from "@arco-design/web-react";
import {
  IconArrowLeft,
  IconArrowRight,
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

const ActionButtons = ({
  handleEntryClick,
  getEntries,
  isFilteredEntriesUpdated,
  setIsFilteredEntriesUpdated,
}) => {
  const activeContent = useStore((state) => state.activeContent);
  const { handleFetchContent, handleToggleStarred, handleToggleStatus } =
    useEntryActions();
  const { handleLeftKey, handleRightKey } = useKeyHandlers(
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
    <div
      className="action-buttons"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "10px",
        borderRadius: "50%",
        boxShadow: "0 4px 10px rgba(var(--primary-6), 0.4)",
      }}
    >
      <Space size={0} direction="vertical">
        <Tooltip
          mini
          position="left"
          content={isUnread ? "Mark as read" : "Mark as unread"}
        >
          <Button
            type="primary"
            size="mini"
            style={{
              borderBottom: "1px solid rgb(var(--primary-5))",
              borderRadius: "50% 50% 0 0",
            }}
            onClick={handleToggleStatus}
            icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
          />
        </Tooltip>
        <Tooltip mini position="left" content={isStarred ? "Unstar" : "Star"}>
          <Button
            type="primary"
            size="mini"
            style={{
              borderRadius: "0",
            }}
            onClick={handleToggleStarred}
            icon={
              isStarred ? (
                <IconStarFill style={{ color: "#ffcd00" }} />
              ) : (
                <IconStar />
              )
            }
          />
        </Tooltip>
        <Tooltip mini position="left" content="Fetch original article">
          <Button
            type="primary"
            size="mini"
            style={{
              borderTop: "1px solid rgb(var(--primary-5))",
              borderRadius: "0",
            }}
            onClick={handleFetchContent}
            icon={<IconCloudDownload />}
          />
        </Tooltip>
        <Tooltip mini position="left" content="Previous article">
          <Button
            type="primary"
            size="mini"
            style={{
              borderTop: "1px solid rgb(var(--primary-5))",
              borderRadius: "0",
            }}
            onClick={handleLeftKey}
            icon={<IconArrowLeft />}
          />
        </Tooltip>
        <Tooltip mini position="left" content="Next article">
          <Button
            type="primary"
            size="mini"
            style={{
              borderTop: "1px solid rgb(var(--primary-5))",
              borderRadius: "0 0 50% 50%",
            }}
            onClick={handleRightKey}
            icon={<IconArrowRight />}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default ActionButtons;
