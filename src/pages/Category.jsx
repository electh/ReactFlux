import { useParams } from "react-router-dom";

import { useAtomValue } from "jotai";
import { buildEntriesUrl, markCategoryAsRead } from "../apis";
import { apiClient } from "../apis/ofetch";
import { configAtom } from "../atoms/configAtom";
import Content from "../components/Content/Content";

const Category = () => {
  const { id: categoryId } = useParams();
  const { orderBy, pageSize } = useAtomValue(configAtom);

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
