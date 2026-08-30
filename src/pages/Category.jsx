import { useCallback } from "react"
import { useParams } from "react-router"

import { getCategoryEntries, markCategoryAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const Category = () => {
  const { id: categoryId } = useParams()

  const getEntries = useCallback(
    (status, starred, filterParams) =>
      getCategoryEntries(categoryId, status, starred, filterParams),
    [categoryId],
  )
  return (
    <Content
      getEntries={getEntries}
      info={{ from: "category", id: categoryId }}
      markAllAsRead={() => markCategoryAsRead(categoryId)}
    />
  )
}

export default Category
