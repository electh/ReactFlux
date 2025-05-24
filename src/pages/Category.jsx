import { partial } from "lodash-es"
import { useParams } from "react-router"

import { getCategoryEntries, markCategoryAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const Category = () => {
  const { id: categoryId } = useParams()

  const getEntries = partial(getCategoryEntries, categoryId)

  return (
    <Content
      getEntries={getEntries}
      info={{ from: "category", id: categoryId }}
      markAllAsRead={() => markCategoryAsRead(categoryId)}
    />
  )
}

export default Category
