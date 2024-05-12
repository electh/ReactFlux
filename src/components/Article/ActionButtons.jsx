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

import { useActiveContent } from "../../hooks/useActiveContent";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import "./ActionButtons.css";

const ActionButtons = ({
  info,
  handleEntryClick,
  entryListRef,
  entryDetailRef,
}) => {
  const { activeContent } = useActiveContent();
  const { handleFetchContent, handleToggleStarred, handleToggleStatus } =
    useEntryActions();
  const { handleLeftKey, handleRightKey, handleEscapeKey } = useKeyHandlers(
    info,
    handleEntryClick,
  );

  if (!activeContent) {
    return null;
  }

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;

  return (
    <Button.Group className="action-buttons">
      <Button
        icon={<IconClose />}
        onClick={() => handleEscapeKey(entryListRef, entryDetailRef)}
        shape="round"
        type="primary"
      />
      <Button
        icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
        onClick={() => handleToggleStatus(activeContent)}
        type="primary"
      />
      <Button
        icon={
          isStarred ? (
            <IconStarFill style={{ color: "#ffcd00" }} />
          ) : (
            <IconStar />
          )
        }
        onClick={() => handleToggleStarred(activeContent)}
        type="primary"
      />
      <Button icon={<IconArrowLeft />} onClick={handleLeftKey} type="primary" />
      <Button
        icon={<IconArrowRight />}
        onClick={handleRightKey}
        type="primary"
      />
      <Button
        icon={<IconCloudDownload />}
        onClick={handleFetchContent}
        shape="round"
        type="primary"
      />
    </Button.Group>
  );
};

export default ActionButtons;
