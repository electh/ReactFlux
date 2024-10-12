import { Input, Tag } from "@arco-design/web-react";
import { useCallback, useEffect, useState } from "react";

const EditableTag = ({ value, onChange, onRemove, editOnMount = false }) => {
  const [isEditing, setIsEditing] = useState(editOnMount);

  const handleEdit = () => {
    setIsEditing(false);
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (isEditing) {
        event.preventDefault();

        const { key, ctrlKey, shiftKey, altKey, metaKey } = event;

        if (["Control", "Shift", "Alt", "Meta", "CapsLock"].includes(key)) {
          return;
        }

        let keyName = key;
        switch (key) {
          case "ArrowLeft":
          case "ArrowRight":
          case "ArrowUp":
          case "ArrowDown":
            keyName = key.replace("Arrow", "").toLowerCase();
            break;
          case " ":
            keyName = "space";
            break;
        }

        const modifiers = [];
        if (ctrlKey) {
          modifiers.push("ctrl");
        }
        if (shiftKey) {
          modifiers.push("shift");
        }
        if (altKey) {
          modifiers.push("alt");
        }
        if (metaKey) {
          modifiers.push("meta");
        }

        const newValue =
          modifiers.length > 0 ? `${modifiers.join("+")}+${keyName}` : keyName;
        onChange(newValue);
        setIsEditing(false);
      }
    },
    [isEditing, onChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return isEditing ? (
    <Input
      autoFocus
      size="mini"
      value={value}
      style={{ width: 84, marginRight: 8 }}
      onPressEnter={handleEdit}
      onBlur={handleEdit}
      onChange={onChange}
    />
  ) : (
    <Tag
      style={{ marginRight: 8 }}
      closable={!!onRemove}
      onClose={(event) => {
        event.stopPropagation();
        onRemove();
      }}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </Tag>
  );
};

export default EditableTag;
