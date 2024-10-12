import { Input, Tag } from "@arco-design/web-react";
import { useEffect, useState } from "react";

const EditableTag = ({ value, onChange, onRemove, editOnMount = false }) => {
  const [isEditing, setIsEditing] = useState(editOnMount);
  const [inputValue, setInputValue] = useState(value);

  const handleEdit = () => {
    if (inputValue && inputValue !== value) {
      onChange(inputValue);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (editOnMount) {
      setIsEditing(true);
    }
  }, [editOnMount]);

  return isEditing ? (
    <Input
      autoFocus
      size="mini"
      value={inputValue}
      style={{ width: 84, marginRight: 8 }}
      onPressEnter={handleEdit}
      onBlur={handleEdit}
      onChange={setInputValue}
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
