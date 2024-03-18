import { Button, Space } from "@arco-design/web-react";
import {
  IconMenuFold,
  IconMenuUnfold,
  IconMinusCircle,
  IconRecord,
  IconSettings,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { useStore } from "../Store";

export default function Toolbar() {
  const collapsed = useStore((state) => state.collapsed);
  const setCollapsed = useStore((state) => state.setCollapsed);
  const activeEntry = useStore((state) => state.activeEntry);
  const toggleStar = useStore((state) => state.toggleStar);
  const toggleUnreadStatus = useStore((state) => state.toggleUnreadStatus);

  const handelToggleStar = (entry) => {
    toggleStar(entry);
  };

  const handelToggleUnreadStatus = (entry) => {
    toggleUnreadStatus(entry);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Button shape="circle" className="trigger" onClick={setCollapsed}>
        {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
      </Button>
      <div style={{ marginRight: 10 }}>
        <Space>
          <Button.Group>
            <Button
              shape="round"
              onClick={() => handelToggleStar(activeEntry)}
              icon={
                activeEntry?.starred ? (
                  <IconStarFill style={{ color: "#ffcd00" }} />
                ) : (
                  <IconStar />
                )
              }
              disabled={!activeEntry}
            />
            <Button
              shape="round"
              onClick={() => handelToggleUnreadStatus(activeEntry)}
              icon={
                activeEntry?.status === "read" ? (
                  <IconMinusCircle />
                ) : (
                  <IconRecord />
                )
              }
              disabled={!activeEntry}
            />
          </Button.Group>
          <Button icon={<IconSettings />} shape="round" />
        </Space>
      </div>
    </div>
  );
}
