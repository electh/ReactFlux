import { Tooltip } from "@arco-design/web-react"
import { forwardRef, useState } from "react"

import useScreenWidth from "@/hooks/useScreenWidth"

const CustomTooltip = forwardRef(({ children, ...props }, ref) => {
  const { isBelowMedium } = useScreenWidth()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Tooltip
      ref={ref}
      popupVisible={!isBelowMedium && isHovered}
      onVisibleChange={(visible) => setIsHovered(visible)}
      {...props}
    >
      {children}
    </Tooltip>
  )
})
CustomTooltip.displayName = "CustomTooltip"

export default CustomTooltip
