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
import { useEffect, useState } from "react";

import { useStore } from "@nanostores/react";
import useEntryActions from "../../hooks/useEntryActions";
import useKeyHandlers from "../../hooks/useKeyHandlers";
import {
  contentState,
  nextContentState,
  prevContentState,
} from "../../store/contentState";
import "./ActionButtons.css";

const ActionButtons = () => {
  const { activeContent } = useStore(contentState);
  const nextContent = useStore(nextContentState);
  const prevContent = useStore(prevContentState);

  const [isFetchedOriginal, setIsFetchedOriginal] = useState(false);

  const {
    handleFetchContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions();

  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } =
    useKeyHandlers();

  const isUnread = activeContent.status === "unread";
  const isStarred = activeContent.starred;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setIsFetchedOriginal(false);
  }, [activeContent]);

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
          disabled={!prevContent}
        />
        <Button
          icon={<IconArrowRight />}
          onClick={() => navigateToNextArticle()}
          shape="circle"
          disabled={!nextContent}
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
