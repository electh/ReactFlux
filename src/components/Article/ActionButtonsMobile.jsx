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

import useStore from "../../Store";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";

const ActionButtonsMobile = ({ handleEntryClick }) => {
  const activeContent = useStore((state) => state.activeContent);
  const { handleFetchContent, toggleEntryStarred, toggleEntryStatus } =
    useEntryActions();
  const { handleLeftKey, handleRightKey, handleEscapeKey } = useKeyHandlers();

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
        onClick={() => handleEscapeKey(handleEntryClick)}
        icon={<IconClose />}
      />
      <Button
        type="primary"
        onClick={() => toggleEntryStatus()}
        icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
      />
      <Button
        type="primary"
        onClick={() => toggleEntryStarred()}
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
      <Button
        type="primary"
        onClick={() => handleLeftKey(handleEntryClick)}
        icon={<IconArrowLeft />}
      />
      <Button
        type="primary"
        shape="round"
        onClick={() => handleRightKey(handleEntryClick)}
        icon={<IconArrowRight />}
      />
    </Button.Group>
  );
};

export default ActionButtonsMobile;
