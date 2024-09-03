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

import { useAtomValue } from "jotai";
import { activeContentAtom } from "../../atoms/contentAtom";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import "./ActionButtons.css";

const ActionButtons = ({ handleEntryClick, entryListRef, entryDetailRef }) => {
  const activeContent = useAtomValue(activeContentAtom);
  const { handleFetchContent, handleToggleStarred, handleToggleStatus } =
    useEntryActions();
  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } =
    useKeyHandlers(handleEntryClick);

  if (!activeContent) {
    return null;
  }

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;

  return (
    <Button.Group className="action-buttons">
      <Button
        icon={<IconClose />}
        onClick={() => exitDetailView(entryListRef, entryDetailRef)}
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
      <Button
        icon={<IconArrowLeft />}
        onClick={navigateToPreviousArticle}
        type="primary"
      />
      <Button
        icon={<IconArrowRight />}
        onClick={navigateToNextArticle}
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
