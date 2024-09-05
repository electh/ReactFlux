import { useParams } from "react-router-dom";

import { useSnapshot } from "valtio";
import { buildEntriesUrl, markCategoryAsRead } from "../apis";
import { apiClient } from "../apis/ofetch";
import Content from "../components/Content/Content";
import { configState } from "../store/configState";

const Category = () => {
  const { id: categoryId } = useParams();
  const { orderBy, pageSize } = useSnapshot(configState);

  const getCategoryEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/categories/${categoryId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    };

    return apiClient.get(buildEntriesUrl(baseParams));
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
