import { Button } from "@arco-design/web-react";
import { useStore } from "../../../store/Store";
import {
  IconClose,
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";

export default function ActionBar() {
  const isMobile = useStore((state) => state.isMobile);
  const activeEntry = useStore((state) => state.activeEntry);
  const toggleStar = useStore((state) => state.toggleStar);
  const toggleUnreadStatus = useStore((state) => state.toggleUnreadStatus);
  const nav = useNavigate();

  const handelToggleStar = (entry) => {
    toggleStar(entry);
  };

  const handelToggleUnreadStatus = (entry) => {
    toggleUnreadStatus(entry);
  };
  return (
    <Button.Group
      style={{
        display: isMobile && activeEntry ? "block" : "none",
        position: "absolute",
        zIndex: "3",
        left: "50%",
        bottom: "20px",
        transform: "translateX(-50%)",
      }}
    >
      <Button
        type="primary"
        shape="round"
        size="large"
        icon={<IconClose />}
        onClick={() => nav(-1)}
      />
      <Button
        type="primary"
        onClick={() => handelToggleStar(activeEntry)}
        size="large"
        icon={
          activeEntry?.starred ? (
            <IconStarFill style={{ color: "#ffcd00" }} />
          ) : (
            <IconStar />
          )
        }
      />
      <Button
        type="primary"
        shape="round"
        size="large"
        onClick={() => handelToggleUnreadStatus(activeEntry)}
        icon={
          activeEntry?.status === "read" ? <IconMinusCircle /> : <IconRecord />
        }
      />
    </Button.Group>
  );
}
