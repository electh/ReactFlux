import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react"
import SimpleBar from "simplebar-react"

import useScreenWidth, { hasCoarsePointerState } from "@/hooks/useScreenWidth"

import "./AdaptiveScrollArea.css"

const setRefValue = (ref, value) => {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

const NativeScrollArea = forwardRef(
  ({ children, className, scrollableNodeProps, style, ...props }, forwardedRef) => {
    const elementRef = useRef(null)
    const {
      className: scrollableClassName,
      ref: scrollableRef,
      style: scrollableStyle,
      ...rest
    } = scrollableNodeProps ?? {}

    const setElementRef = useCallback(
      (element) => {
        elementRef.current = element
        setRefValue(scrollableRef, element)
      },
      [scrollableRef],
    )

    useImperativeHandle(
      forwardedRef,
      () => ({
        contentWrapperEl: elementRef.current,
        el: elementRef.current,
        getScrollElement: () => elementRef.current,
      }),
      [],
    )

    return (
      <div
        {...props}
        {...rest}
        ref={setElementRef}
        className={classNames("adaptive-scroll-area-native", className, scrollableClassName)}
        data-native-scroll="true"
        style={{ ...style, ...scrollableStyle }}
      >
        {children}
      </div>
    )
  },
)
NativeScrollArea.displayName = "NativeScrollArea"

const AdaptiveScrollArea = forwardRef((props, ref) => {
  const { isBelowMedium } = useScreenWidth()
  const hasCoarsePointer = useStore(hasCoarsePointerState)

  return isBelowMedium || hasCoarsePointer ? (
    <NativeScrollArea ref={ref} {...props} />
  ) : (
    <SimpleBar ref={ref} {...props} />
  )
})
AdaptiveScrollArea.displayName = "AdaptiveScrollArea"

export default AdaptiveScrollArea
