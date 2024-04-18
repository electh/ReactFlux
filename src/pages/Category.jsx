import { useParams } from "react-router-dom";

import { useAtomValue } from "jotai";
import { apiClient } from "../apis/axios";
import { buildEntriesUrl } from "../apis/index";
import { configAtom } from "../atoms/configAtom";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

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
    <ContentProvider>
      <Content
        info={{ from: "category", id: categoryId }}
        getEntries={getCategoryEntries}
        markAllAsRead={markCategoryAsRead}
      />
    </ContentProvider>
  );
};

export default Category;
