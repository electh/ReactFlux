import { Tooltip } from "@arco-design/web-react";
import { useState } from "react";
import { useScreenWidth } from "../../hooks/useScreenWidth";

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
