import { Form, Input, Modal, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import useCategoryOperations from "@/hooks/useCategoryOperations"
import { polyglotState } from "@/hooks/useLanguage"

const EditCategoryModal = ({
  visible,
  setVisible,
  categoryForm,
  selectedCategory,
  onSuccess,
  useNotification = false,
  showHiddenField = true,
}) => {
  const { polyglot } = useStore(polyglotState)
  const { editCategory } = useCategoryOperations(useNotification)

  const handleCancel = () => {
    setVisible(false)
    categoryForm.resetFields()
  }

  const handleSubmit = async (values) => {
    const success = await editCategory(selectedCategory.id, values.title, values.hidden)
    if (success) {
      setVisible(false)
      categoryForm.resetFields()
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  if (!selectedCategory) {
    return null
  }

  const modalTitle = polyglot.t("category_list.edit_category_title")
  const titleLabel = polyglot.t("category_list.edit_category_title_label")
  const titlePlaceholder = polyglot.t("category_list.edit_category_title_placeholder")
  const hiddenLabel = polyglot.t("category_list.edit_category_hidden_label")

  return (
    <Modal
      unmountOnExit
      className="modal-style"
      closable={false}
      title={modalTitle}
      visible={visible}
      onCancel={handleCancel}
      onOk={categoryForm.submit}
    >
      <Form form={categoryForm} layout="vertical" onSubmit={handleSubmit}>
        <Form.Item field="title" label={titleLabel} rules={[{ required: true }]}>
          <Input placeholder={titlePlaceholder} />
        </Form.Item>

        {showHiddenField && (
          <Form.Item
            field="hidden"
            initialValue={selectedCategory.hide_globally}
            label={hiddenLabel}
            rules={[{ type: "boolean" }]}
            triggerPropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default EditCategoryModal
