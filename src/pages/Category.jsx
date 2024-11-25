import { useParams } from "react-router"

import { buildEntriesUrl, markCategoryAsRead } from "@/apis"
import apiClient from "@/apis/ofetch"
import Content from "@/components/Content/Content"
import { getSettings } from "@/store/settingsState"

const Category = () => {
  const { id: categoryId } = useParams()
  const orderBy = getSettings("orderBy")
  const pageSize = getSettings("pageSize")
  const showHiddenFeeds = getSettings("showHiddenFeeds")

  const getCategoryEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/categories/${categoryId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    }

    const extraParams = { globally_visible: !showHiddenFeeds }

    return apiClient.get(buildEntriesUrl(baseParams, extraParams))
  }

  return (
    <Content
      getEntries={getCategoryEntries}
      info={{ from: "category", id: categoryId }}
      markAllAsRead={() => markCategoryAsRead(categoryId)}
    />
  )
}

export default Category
