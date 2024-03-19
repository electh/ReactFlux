import { Button, Space } from "@arco-design/web-react";
import {
  IconLeft,
  IconMenuFold,
  IconMenuUnfold,
  IconMinusCircle,
  IconRecord,
  IconSettings,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { useStore } from "../store/Store";
import { useState } from "react";
import Settings from "../pages/settings/Settings";
import SideDrawer from "./SideDrawer";

export default function Toolbar() {
  const collapsed = useStore((state) => state.collapsed);
  const setCollapsed = useStore((state) => state.setCollapsed);
  const activeEntry = useStore((state) => state.activeEntry);
  const toggleStar = useStore((state) => state.toggleStar);
  const toggleUnreadStatus = useStore((state) => state.toggleUnreadStatus);
  const [drawVisible, setDrawVisible] = useState(false);
  const isMobile = useStore((state) => state.isMobile);
  const [visible, setVisible] = useState(false);
  const setActiveEntry = useStore((state) => state.setActiveEntry);
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
      <Space>
        <Button
          shape="circle"
          className="trigger"
          onClick={isMobile ? () => setVisible(!visible) : setCollapsed}
        >
          {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
        </Button>
        <Button
          className="back-button"
          shape="round"
          icon={<IconLeft />}
          onClick={() => setActiveEntry(null)}
          style={{
            visibility: isMobile && activeEntry ? "visible" : "hidden",
            opacity: isMobile && activeEntry ? "1" : "0",
            transition: "all 0.2s ease",
          }}
        />
      </Space>
      <SideDrawer visible={visible} setVisible={setVisible} />
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
          <Button
            icon={<IconSettings />}
            shape="round"
            onClick={() => {
              setDrawVisible(true);
            }}
          />
          <Settings visible={drawVisible} setVisible={setDrawVisible} />
        </Space>
      </div>
    </div>
  );
}
