import { Button } from "@arco-design/web-react"
import { IconPlus } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"

export default function AddFeed() {
  const { setAddFeedModalVisible } = useModalToggle()
  const { polyglot } = useStore(polyglotState)

  return (
    <CustomTooltip mini content={polyglot.t("sidebar.add_feed")}>
      <Button
        icon={<IconPlus />}
        shape="circle"
        size="small"
        style={{ marginTop: "1em", marginBottom: "0.5em" }}
        onClick={() => setAddFeedModalVisible(true)}
      />
    </CustomTooltip>
  )
}
