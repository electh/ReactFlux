import { Tooltip } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { forwardRef } from "react"

import { canPreciselyHoverState } from "@/hooks/useScreenWidth"

const CustomTooltip = forwardRef(({ disabled, ...props }, ref) => {
  const canPreciselyHover = useStore(canPreciselyHoverState)

  return <Tooltip ref={ref} disabled={disabled || !canPreciselyHover} {...props} />
})
CustomTooltip.displayName = "CustomTooltip"

export default CustomTooltip
