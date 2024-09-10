import { useParams } from "react-router-dom";

import { buildEntriesUrl, markCategoryAsRead } from "../apis";
import { apiClient } from "../apis/ofetch";
import Content from "../components/Content/Content";
import { getSettings } from "../store/settingsState";

const Category = () => {
  const { id: categoryId } = useParams();
  const orderBy = getSettings("orderBy");
  const pageSize = getSettings("pageSize");
  const showAllFeeds = getSettings("showAllFeeds");

  const getCategoryEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/categories/${categoryId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    };

    const extraParams = { globally_visible: !showAllFeeds };

    return apiClient.get(buildEntriesUrl(baseParams, extraParams));
  };

  return (
    <Content
      info={{ from: "category", id: categoryId }}
      getEntries={getCategoryEntries}
      markAllAsRead={() => markCategoryAsRead(categoryId)}
    />
  );
};

export default Category;
