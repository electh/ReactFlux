import { Button, Space, Tag } from "@arco-design/web-react"
import { IconPlus, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useRef, useState } from "react"

import EditableTag from "./EditableTag"

import { duplicateHotkeysState, resetHotkey, updateHotkey } from "@/store/hotkeysState"

const capitalizeFirstLetter = (word) => word.charAt(0).toUpperCase() + word.slice(1)

const processKeyName = (keys) =>
  keys
    .map((key) => {
      const modifiedKey = key
        .replace("left", "←")
        .replace("right", "→")
        .replace("up", "↑")
        .replace("down", "↓")
      return modifiedKey.includes("+")
        ? modifiedKey.split("+").map(capitalizeFirstLetter).join(" + ")
        : capitalizeFirstLetter(modifiedKey)
    })
    .join(" / ")

const EditableTagGroup = ({ keys, record }) => {
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const [isEditing, setIsEditing] = useState(false)

  const groupRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupRef.current && !groupRef.current.contains(event.target)) {
        setIsEditing(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      const newKeys = keys.filter((key) => key !== "")
      if (newKeys.length !== keys.length) {
        updateHotkey(record.action, newKeys)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  return (
    <div ref={groupRef}>
      {isEditing ? (
        <Space wrap style={{ marginBottom: -8 }}>
          {keys.map((key, index) => (
            <EditableTag
              key={`${record.action}-${key}`}
              editOnMount={key === ""}
              value={key}
              onChange={(newKey) => {
                const newKeys = [...keys]
                newKeys[index] = newKey
                updateHotkey(record.action, newKeys)
              }}
              onRemove={() => {
                const newKeys = keys.filter((_, i) => i !== index)
                updateHotkey(record.action, newKeys)
              }}
            />
          ))}
          <Tag
            icon={<IconPlus />}
            style={{
              backgroundColor: "var(--color-bg-1)",
              border: "1px dashed var(--color-border-2)",
              cursor: "pointer",
              width: "32px",
            }}
            onClick={() => {
              const newKeys = [...keys, ""]
              updateHotkey(record.action, newKeys)
            }}
          />
          <Button
            icon={<IconRefresh />}
            shape="circle"
            size="mini"
            onClick={() => resetHotkey(record.action)}
          />
        </Space>
      ) : (
        <Tag
          style={{
            cursor: "pointer",
            backgroundColor: keys.some((key) => duplicateHotkeys.includes(key))
              ? "var(--color-danger-light-4)"
              : "var(--color-fill-2)",
            color: keys.some((key) => duplicateHotkeys.includes(key))
              ? "white"
              : "var(--color-text-1)",
          }}
          onClick={() => setIsEditing(true)}
        >
          {processKeyName(keys)}
        </Tag>
      )}
    </div>
  )
}

export default EditableTagGroup
