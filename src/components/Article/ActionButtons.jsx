import { Button } from "@arco-design/web-react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconClose,
  IconCloudDownload,
  IconMinusCircle,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { useState } from "react";

import { useStore } from "@nanostores/react";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import { contentState } from "../../store/contentState";
import { filteredEntriesState } from "../../store/contentState";
import "./ActionButtons.css";

const ActionButtons = ({ handleEntryClick, entryListRef }) => {
  const { activeContent } = useStore(contentState);
  const filteredEntries = useStore(filteredEntriesState);

  const [isFetchedOriginal, setIsFetchedOriginal] = useState(false);

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions();
  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } =
    useKeyHandlers(handleEntryClick, entryListRef);

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;
  const currentIndex = filteredEntries.findIndex(
    (entry) => entry.id === activeContent?.id,
  );
  const isFirstEntry = currentIndex === 0;
  const isLastEntry = currentIndex === filteredEntries.length - 1;

  return (
    <div className="action-buttons">
      <div className="left-side">
        <Button
          icon={<IconClose />}
          onClick={() => exitDetailView()}
          shape="circle"
        />
        <Button
          icon={<IconArrowLeft />}
          onClick={() => navigateToPreviousArticle()}
          shape="circle"
          disabled={isFirstEntry}
        />
        <Button
          icon={<IconArrowRight />}
          onClick={() => navigateToNextArticle()}
          shape="circle"
          disabled={isLastEntry}
        />
      </div>
      <div className="right-side">
        <Button
          icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
          onClick={() => handleToggleStatus(activeContent)}
          shape="circle"
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
          shape="circle"
        />
        <Button
          icon={<IconCloudDownload />}
          onClick={async () => {
            await handleFetchContent();
            setIsFetchedOriginal(true);
          }}
          shape="circle"
          disabled={isFetchedOriginal}
        />
        <Button
          icon={<IconSave />}
          onClick={handleSaveToThirdPartyServices}
          shape="circle"
        />
      </div>
    </div>
  );
};

export default ActionButtons;
