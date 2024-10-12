import { Button, Space, Tag } from "@arco-design/web-react";
import { IconPlus, IconRefresh } from "@arco-design/web-react/icon";
import { useEffect, useRef, useState } from "react";
import { resetHotkey, updateHotkey } from "../../store/hotkeysState";
import EditableTag from "./EditableTag";

const capitalizeFirstLetter = (word) =>
  word.trim().length > 1 ? word.charAt(0).toUpperCase() + word.slice(1) : word;

const processKeyName = (keys) =>
  keys
    .map((key) => {
      const modifiedKey = key
        .replace("left", "←")
        .replace("right", "→")
        .replace("up", "↑")
        .replace("down", "↓");
      return modifiedKey.includes("+")
        ? modifiedKey.split("+").map(capitalizeFirstLetter).join(" + ")
        : capitalizeFirstLetter(modifiedKey);
    })
    .join(" / ");

const EditableTagGroup = ({ keys, record }) => {
  const [isEditing, setIsEditing] = useState(false);

  const groupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupRef.current && !groupRef.current.contains(event.target)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={groupRef}>
      {isEditing ? (
        <Space wrap>
          {keys.map((key, index) => (
            <EditableTag
              key={`${record.action}-${key}`}
              value={key}
              editOnMount={key === ""}
              onChange={(newKey) => {
                const newKeys = [...keys];
                newKeys[index] = newKey;
                updateHotkey(record.action, newKeys);
              }}
              onRemove={() => {
                const newKeys = keys.filter((_, i) => i !== index);
                updateHotkey(record.action, newKeys);
              }}
            />
          ))}
          <Tag
            icon={<IconPlus />}
            style={{
              backgroundColor: "var(--color-fill-2)",
              border: "1px dashed var(--color-fill-3)",
              cursor: "pointer",
            }}
            onClick={() => {
              const newKeys = [...keys, ""];
              updateHotkey(record.action, newKeys);
            }}
          />
          <Button
            icon={<IconRefresh />}
            shape="circle"
            size="small"
            onClick={() => resetHotkey(record.action)}
          />
        </Space>
      ) : (
        <Tag onClick={() => setIsEditing(true)} style={{ cursor: "pointer" }}>
          {processKeyName(keys)}
        </Tag>
      )}
    </div>
  );
};

export default EditableTagGroup;
