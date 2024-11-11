import { Input, Tag } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useState } from "react"

import { duplicateHotkeysState } from "@/store/hotkeysState"

const EditableTag = ({ value, onChange, onRemove, editOnMount = false }) => {
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const [isEditing, setIsEditing] = useState(editOnMount)

  const handleEdit = () => {
    if (value === "") {
      onRemove()
    }
    setIsEditing(false)
  }

  const handleKeyDown = useCallback(
    (event) => {
      if (isEditing) {
        event.preventDefault()

        const { key, ctrlKey, shiftKey, altKey, metaKey } = event

        if (["Control", "Shift", "Alt", "Meta", "CapsLock"].includes(key)) {
          return
        }

        let keyName = key
        switch (key) {
          case "ArrowLeft":
          case "ArrowRight":
          case "ArrowUp":
          case "ArrowDown":
            keyName = key.replace("Arrow", "").toLowerCase()
            break
          case " ":
            keyName = "space"
            break
        }

        const modifiers = []
        if (ctrlKey) {
          modifiers.push("ctrl")
        }
        if (shiftKey) {
          modifiers.push("shift")
        }
        if (altKey) {
          modifiers.push("alt")
        }
        if (metaKey) {
          modifiers.push("meta")
        }

        const newValue = modifiers.length > 0 ? `${modifiers.join("+")}+${keyName}` : keyName
        onChange(newValue)
        setIsEditing(false)
      }
    },
    [isEditing, onChange],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return isEditing ? (
    <Input
      autoFocus
      size="mini"
      status={duplicateHotkeys.includes(value) ? "error" : undefined}
      style={{ width: 80 }}
      value={value}
      onBlur={handleEdit}
      onChange={onChange}
      onPressEnter={handleEdit}
    />
  ) : (
    <Tag
      closable={!!onRemove}
      style={{
        backgroundColor: duplicateHotkeys.includes(value)
          ? "var(--color-danger-light-4)"
          : "var(--color-fill-2)",
        color: duplicateHotkeys.includes(value) ? "white" : "var(--color-text-1)",
      }}
      onClick={() => setIsEditing(true)}
      onClose={(event) => {
        event.stopPropagation()
        onRemove()
      }}
    >
      {value}
    </Tag>
  )
}

export default EditableTag
