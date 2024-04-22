import { useParams } from "react-router-dom";

import { useAtomValue } from "jotai";
import { buildEntriesUrl } from "../apis";
import { apiClient } from "../apis/axios";
import { configAtom } from "../atoms/configAtom";
import Content from "../components/Content/Content";

const Category = () => {
  const { id: categoryId } = useParams();
  const config = useAtomValue(configAtom);
  const { orderBy, pageSize } = config;

  const getCategoryEntries = async (offset = 0, status = null) => {
    const baseParams = {
      baseUrl: `/v1/categories/${categoryId}/entries`,
      orderField: orderBy,
      offset,
      limit: pageSize,
      status,
    };

    const url = buildEntriesUrl(baseParams);
    return apiClient.get(url);
  };

  const markCategoryAsRead = async () => {
    return apiClient.put(`/v1/categories/${categoryId}/mark-all-as-read`);
  };

  return (
    <Content
      info={{ from: "category", id: categoryId }}
      getEntries={getCategoryEntries}
      markAllAsRead={markCategoryAsRead}
    />
  );
};

export default Category;
