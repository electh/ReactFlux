import { useCallback, useEffect, useRef, useState } from "react"

const CONTEXT_MENU_OPEN_EVENT = "reactflux:context-menu-open"
const LONG_PRESS_DELAY_MS = 500
const MOVE_TOLERANCE_PX = 10

const useLongPressContextMenu = ({ disabled = false } = {}) => {
  const activePressRef = useRef(null)
  const contextMenuIdRef = useRef(Symbol("context-menu"))
  const contextMenuTargetRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const suppressNextClickRef = useRef(false)
  const [popupVisible, setPopupVisible] = useState(false)

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      globalThis.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    activePressRef.current = null
  }, [])

  const handlePopupVisibleChange = useCallback(
    (visible) => {
      const nextVisible = visible && !disabled

      if (nextVisible) {
        document.dispatchEvent(
          new CustomEvent(CONTEXT_MENU_OPEN_EVENT, { detail: contextMenuIdRef.current }),
        )
      }

      setPopupVisible(nextVisible)
    },
    [disabled],
  )

  useEffect(() => {
    const handleOtherContextMenuOpen = (event) => {
      if (event.detail !== contextMenuIdRef.current) {
        setPopupVisible(false)
      }
    }

    document.addEventListener(CONTEXT_MENU_OPEN_EVENT, handleOtherContextMenuOpen)
    return () => {
      cancelLongPress()
      document.removeEventListener(CONTEXT_MENU_OPEN_EVENT, handleOtherContextMenuOpen)
    }
  }, [cancelLongPress])

  useEffect(() => {
    if (!disabled) {
      return
    }

    cancelLongPress()
    const timeoutId = globalThis.setTimeout(() => setPopupVisible(false), 0)
    return () => globalThis.clearTimeout(timeoutId)
  }, [cancelLongPress, disabled])

  const handlePointerDown = useCallback(
    (event) => {
      if (disabled || event.pointerType !== "touch" || !event.isPrimary) {
        return
      }

      cancelLongPress()
      suppressNextClickRef.current = false

      const { clientX, clientY, currentTarget, pointerId } = event
      activePressRef.current = { clientX, clientY, pointerId, target: currentTarget }
      longPressTimerRef.current = globalThis.setTimeout(() => {
        longPressTimerRef.current = null

        const activePress = activePressRef.current
        if (!activePress?.target.isConnected) {
          return
        }

        suppressNextClickRef.current = true
        activePress.target.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            button: 2,
            cancelable: true,
            clientX: activePress.clientX,
            clientY: activePress.clientY,
            view: globalThis,
          }),
        )
      }, LONG_PRESS_DELAY_MS)
    },
    [cancelLongPress, disabled],
  )

  const handlePointerMove = useCallback(
    (event) => {
      const activePress = activePressRef.current
      if (!activePress || activePress.pointerId !== event.pointerId) {
        return
      }

      const movementDistance = Math.hypot(
        event.clientX - activePress.clientX,
        event.clientY - activePress.clientY,
      )
      if (movementDistance > MOVE_TOLERANCE_PX) {
        cancelLongPress()
      }
    },
    [cancelLongPress],
  )

  const handlePointerEnd = useCallback(
    (event) => {
      if (activePressRef.current?.pointerId === event.pointerId) {
        cancelLongPress()
      }
    },
    [cancelLongPress],
  )

  const handleContextMenu = useCallback(
    (event) => {
      contextMenuTargetRef.current = event.currentTarget
      if (activePressRef.current) {
        suppressNextClickRef.current = true
      }
      cancelLongPress()
    },
    [cancelLongPress],
  )

  const handleClickCapture = useCallback((event) => {
    if (!suppressNextClickRef.current) {
      return
    }

    suppressNextClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }, [])

  return {
    dropdownProps: {
      popupVisible: !disabled && popupVisible,
      onVisibleChange: handlePopupVisibleChange,
      triggerProps: { getTargetDOMNode: () => contextMenuTargetRef.current },
    },
    longPressProps: {
      onClickCapture: handleClickCapture,
      onContextMenu: handleContextMenu,
      onPointerCancel: handlePointerEnd,
      onPointerDown: handlePointerDown,
      onPointerLeave: handlePointerEnd,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
    },
  }
}

export default useLongPressContextMenu
