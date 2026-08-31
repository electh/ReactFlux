import { Message, Modal, Notification } from "@arco-design/web-react"
import { useNavigate } from "react-router"

import { addCategory, deleteCategory, updateCategory } from "@/apis/categories"
import { polyglotState } from "@/hooks/useLanguage"
import { setCategoriesData, setFeedsData } from "@/store/dataState"
import {
  getCurrentHomePath,
  getCurrentHomeTarget,
  resetCurrentHomeTargetIfMatches,
} from "@/store/homePageState"
import { currentRoutePathState } from "@/store/locationState"
import { confirmDialogProps, destructiveConfirmButtonProps } from "@/utils/confirm-dialog"
import { createEntityHomeTarget, isSameHomeTarget } from "@/utils/home-page"

const useCategoryOperations = (useNotification = false) => {
  const { polyglot } = polyglotState.get()
  const navigate = useNavigate()

  const showMessage = (message, type = "success") => {
    if (useNotification) {
      Notification[type]({ title: message })
    } else {
      Message[type](message)
    }
  }

  const addNewCategory = async (title) => {
    if (!title?.trim()) {
      return false
    }

    try {
      const data = await addCategory(title.trim())
      setCategoriesData((prevCategories) => [...prevCategories, { ...data }])

      const successMessage = polyglot.t("category_list.add_category_success")
      showMessage(successMessage)
      return true
    } catch (error) {
      console.error(`${polyglot.t("category_list.add_category_error")}:`, error)

      const errorMessage = polyglot.t("category_list.add_category_error")
      showMessage(errorMessage, "error")
      return false
    }
  }

  const editCategory = async (categoryId, newTitle, hidden) => {
    try {
      const data = await updateCategory(categoryId, newTitle, hidden)

      // Update feeds that belong to this category
      setFeedsData((prevFeeds) =>
        prevFeeds.map((feed) =>
          feed.category.id === categoryId
            ? {
                ...feed,
                category: {
                  ...feed.category,
                  title: newTitle,
                  hide_globally: hidden,
                },
              }
            : feed,
        ),
      )

      // Update categories list
      setCategoriesData((prevCategories) =>
        prevCategories.map((category) =>
          category.id === categoryId ? { ...category, ...data } : category,
        ),
      )

      const successMessage = polyglot.t("category_list.update_category_success")
      showMessage(successMessage)
      return true
    } catch (error) {
      console.error("Failed to update category:", error)
      const errorMessage = polyglot.t("category_list.update_category_error")
      showMessage(errorMessage, "error")
      return false
    }
  }

  const deleteCategoryDirectly = async (category) => {
    try {
      const response = await deleteCategory(category.id)
      if (response.status !== 204) {
        throw new Error(`Unexpected status: ${response.status}`)
      }

      const categoryTarget = createEntityHomeTarget("category", category.id)
      const categoryPath = `/category/${category.id}`
      setCategoriesData((prevCategories) => prevCategories.filter((c) => c.id !== category.id))

      const homePageWasReset = resetCurrentHomeTargetIfMatches(categoryTarget)
      const currentPath = currentRoutePathState.get()
      if (currentPath === categoryPath || currentPath.startsWith(`${categoryPath}/`)) {
        navigate(getCurrentHomePath() ?? "/", { replace: true })
      }

      const successMessage = polyglot.t("category_list.remove_category_success", {
        title: category.title,
      })
      showMessage(successMessage)
      if (homePageWasReset) {
        showMessage(polyglot.t("home_page.fallback_notice"), "warning")
      }
      return true
    } catch (error) {
      console.error(`Failed to delete category: ${category.title}`, error)

      const errorMessage = polyglot.t("category_list.remove_category_error", {
        title: category.title,
      })
      showMessage(errorMessage, "error")
      return false
    }
  }

  const handleDeleteCategory = async (category, requireConfirmation = true) => {
    const categoryTarget = createEntityHomeTarget("category", category.id)
    const isHomePage = isSameHomeTarget(getCurrentHomeTarget(), categoryTarget)
    if (!requireConfirmation && !isHomePage) {
      return deleteCategoryDirectly(category)
    }

    const confirmation = polyglot.t("sidebar.delete_category_confirm_content", {
      title: category.title,
    })
    Modal.confirm({
      ...confirmDialogProps,
      title: polyglot.t("sidebar.delete_category_confirm_title"),
      content: isHomePage
        ? `${confirmation} ${polyglot.t("home_page.delete_warning")}`
        : confirmation,
      okButtonProps: destructiveConfirmButtonProps,
      onOk: () => deleteCategoryDirectly(category),
    })
  }

  return {
    addNewCategory,
    editCategory,
    deleteCategoryDirectly,
    handleDeleteCategory,
  }
}

export default useCategoryOperations
