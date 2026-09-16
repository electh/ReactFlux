import { Form, Input, Tag } from "@arco-design/web-react"
import { IconPlus } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useState } from "react"

import EditCategoryModal from "@/components/ui/EditCategoryModal"
import useCategoryOperations from "@/hooks/useCategoryOperations"
import { polyglotState } from "@/hooks/useLanguage"
import { categoriesState } from "@/store/dataState"
import "./CategoryList.css"

const CategoryList = () => {
  const categories = useStore(categoriesState)
  const { polyglot } = useStore(polyglotState)
  const addCategoryLabel = polyglot.t("category_list.add_category")

  const [categoryForm] = Form.useForm()
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [inputAddValue, setInputAddValue] = useState("")
  const [selectedCategory, setSelectedCategory] = useState({})
  const [showAddInput, setShowAddInput] = useState(false)

  const { addNewCategory, handleDeleteCategory } = useCategoryOperations(false)

  const handleAddNewCategory = async () => {
    await addNewCategory(inputAddValue)
    setInputAddValue("")
    setShowAddInput(false)
  }

  const handleSelectCategory = (category) => {
    setSelectedCategory(category)
    setCategoryModalVisible(true)
    categoryForm.setFieldsValue({ title: category.title })
  }

  return (
    <>
      <div>
        {categories.map((category) => (
          <Tag
            key={category.id}
            visible
            className="tag-style"
            closable={category.feedCount === 0}
            size="medium"
            onClose={async (event) => {
              event.stopPropagation()
              await handleDeleteCategory(category, false)
            }}
          >
            <button
              aria-expanded={categoryModalVisible && selectedCategory.id === category.id}
              aria-haspopup="dialog"
              className="category-edit-button"
              data-category-edit-id={category.id}
              type="button"
              onClick={() => handleSelectCategory(category)}
            >
              {category.title}
            </button>
          </Tag>
        ))}
        {showAddInput ? (
          <Input
            autoFocus
            aria-label={addCategoryLabel}
            className="input-style"
            size="small"
            value={inputAddValue}
            onBlur={handleAddNewCategory}
            onChange={setInputAddValue}
            onPressEnter={handleAddNewCategory}
          />
        ) : (
          <button
            aria-label={addCategoryLabel}
            className="add-category-button"
            type="button"
            onClick={() => setShowAddInput(true)}
          >
            <IconPlus aria-hidden="true" />
          </button>
        )}
      </div>
      {selectedCategory && (
        <EditCategoryModal
          categoryForm={categoryForm}
          fallbackFocusSelector={`.settings-modal [data-category-edit-id="${selectedCategory.id}"], .settings-modal .arco-tabs-header-title-active, .sidebar-profile-trigger`}
          selectedCategory={selectedCategory}
          setVisible={setCategoryModalVisible}
          useNotification={false}
          visible={categoryModalVisible}
        />
      )}
    </>
  )
}

export default CategoryList
