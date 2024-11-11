import { useScreenWidth } from "@/hooks/useScreenWidth";
import { Tooltip } from "@arco-design/web-react";
import { useState } from "react";

const CustomTooltip = ({ children, ...props }) => {
  const { isBelowMedium } = useScreenWidth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip
      popupVisible={!isBelowMedium && isHovered}
      onVisibleChange={(visible) => setIsHovered(visible)}
      {...props}
    >
      {children}
    </Tooltip>
  );
};

export default CustomTooltip;
