import { Button, Space, Tooltip } from "@arco-design/web-react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { useContext } from "react";

import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import ContentContext from "../Content/ContentContext";

const ActionButtons = ({ handleEntryClick }) => {
  const { activeContent } = useContext(ContentContext);
  const { toggleEntryStarred, toggleEntryStatus } = useEntryActions();
  const { handleLeftKey, handleRightKey } = useKeyHandlers();

  return activeContent ? (
    <div
      className="action-buttons"
      style={{
        position: "fixed",
        borderRadius: "50%",
        bottom: "20px",
        right: "10px",
        boxShadow: "0 4px 10px rgba(var(--primary-6), 0.4)",
      }}
    >
      <Space size={0} direction="vertical">
        <Tooltip
          mini
          position="left"
          content={
            activeContent.status === "unread"
              ? "Mark as Read"
              : "Mark as Unread"
          }
        >
          <Button
            type="primary"
            size="mini"
            style={{
              borderBottom: "1px solid rgb(var(--primary-5))",
              borderRadius: "50% 50% 0 0",
            }}
            onClick={() => toggleEntryStatus()}
            icon={
              activeContent.status === "unread" ? (
                <IconMinusCircle />
              ) : (
                <IconRecord />
              )
            }
          />
        </Tooltip>
        <Tooltip
          mini
          position="left"
          content={activeContent.starred === false ? "Star" : "Unstar"}
        >
          <Button
            type="primary"
            size="mini"
            style={{
              borderRadius: "0",
            }}
            onClick={() => toggleEntryStarred()}
            icon={
              activeContent.starred ? (
                <IconStarFill style={{ color: "#ffcd00" }} />
              ) : (
                <IconStar />
              )
            }
          />
        </Tooltip>
        <Tooltip mini position="left" content="Previous Article">
          <Button
            type="primary"
            size="mini"
            style={{
              borderTop: "1px solid rgb(var(--primary-5))",
              borderRadius: "0",
            }}
            onClick={() => handleLeftKey(handleEntryClick)}
            icon={<IconArrowLeft />}
          />
        </Tooltip>
        <Tooltip mini position="left" content="Next Article">
          <Button
            type="primary"
            size="mini"
            style={{
              borderTop: "1px solid rgb(var(--primary-5))",
              borderRadius: "0 0 50% 50%",
            }}
            onClick={() => handleRightKey(handleEntryClick)}
            icon={<IconArrowRight />}
          />
        </Tooltip>
      </Space>
    </div>
  ) : null;
};

export default ActionButtons;
