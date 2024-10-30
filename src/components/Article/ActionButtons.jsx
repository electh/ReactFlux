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
import { polyglotState } from "../../hooks/useLanguage";
import {
  contentState,
  nextContentState,
  prevContentState,
} from "../../store/contentState";
import { dataState } from "../../store/dataState";
import CustomTooltip from "../ui/CustomTooltip";
import "./ActionButtons.css";

const ActionButtons = () => {
  const { activeContent } = useStore(contentState);
  const { hasIntegrations } = useStore(dataState);
  const { polyglot } = useStore(polyglotState);
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
        <CustomTooltip content={polyglot.t("article_card.close_tooltip")} mini>
          <Button
            icon={<IconClose />}
            onClick={() => exitDetailView()}
            shape="circle"
          />
        </CustomTooltip>
        <CustomTooltip
          content={polyglot.t("article_card.previous_tooltip")}
          mini
        >
          <Button
            icon={<IconArrowLeft />}
            onClick={() => navigateToPreviousArticle()}
            shape="circle"
            disabled={!prevContent}
          />
        </CustomTooltip>
        <CustomTooltip content={polyglot.t("article_card.next_tooltip")} mini>
          <Button
            icon={<IconArrowRight />}
            onClick={() => navigateToNextArticle()}
            shape="circle"
            disabled={!nextContent}
          />
        </CustomTooltip>
      </div>
      <div className="right-side">
        <CustomTooltip
          mini
          content={
            isUnread
              ? polyglot.t("article_card.mark_as_read_tooltip")
              : polyglot.t("article_card.mark_as_unread_tooltip")
          }
        >
          <Button
            icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
            onClick={() => handleToggleStatus(activeContent)}
            shape="circle"
          />
        </CustomTooltip>
        <CustomTooltip
          mini
          content={
            isStarred
              ? polyglot.t("article_card.unstar_tooltip")
              : polyglot.t("article_card.star_tooltip")
          }
        >
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
        </CustomTooltip>
        <CustomTooltip
          content={polyglot.t("article_card.fetch_original_tooltip")}
          mini
        >
          <Button
            icon={<IconCloudDownload />}
            onClick={async () => {
              await handleFetchContent();
              setIsFetchedOriginal(true);
            }}
            shape="circle"
            disabled={isFetchedOriginal}
          />
        </CustomTooltip>
        {hasIntegrations && (
          <CustomTooltip
            mini
            content={polyglot.t(
              "article_card.save_to_third_party_services_tooltip",
            )}
          >
            <Button
              icon={<IconSave />}
              onClick={handleSaveToThirdPartyServices}
              shape="circle"
            />
          </CustomTooltip>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
