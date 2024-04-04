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
import "./ActionButtons.css";

const ActionButtons = ({ info, handleEntryClick, getEntries }) => {
  const activeContent = useStore((state) => state.activeContent);
  const { handleFetchContent, handleToggleStarred, handleToggleStatus } =
    useEntryActions();
  const { handleLeftKey, handleRightKey } = useKeyHandlers(
    info,
    handleEntryClick,
    getEntries,
  );

  if (!activeContent) {
    return null;
  }

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;

  return (
    <div className="action-buttons">
      <Space size={0} direction="vertical">
        <Tooltip
          mini
          position="left"
          content={isUnread ? "Mark as read" : "Mark as unread"}
        >
          <Button
            className="button-read-unread"
            onClick={handleToggleStatus}
            size="mini"
            type="primary"
            icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
          />
        </Tooltip>
        <Tooltip mini position="left" content={isStarred ? "Unstar" : "Star"}>
          <Button
            className="button-star"
            onClick={handleToggleStarred}
            size="mini"
            type="primary"
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
            className="button-action"
            icon={<IconCloudDownload />}
            onClick={handleFetchContent}
            size="mini"
            type="primary"
          />
        </Tooltip>
        <Tooltip mini position="left" content="Previous article">
          <Button
            className="button-action"
            icon={<IconArrowLeft />}
            onClick={handleLeftKey}
            size="mini"
            type="primary"
          />
        </Tooltip>
        <Tooltip mini position="left" content="Next article">
          <Button
            className="button-next"
            icon={<IconArrowRight />}
            onClick={handleRightKey}
            size="mini"
            type="primary"
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default ActionButtons;
