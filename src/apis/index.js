import { apiClient } from "./ofetch";

export * from "./categories";
export * from "./entries";
export * from "./feeds";

export const getCurrentUser = async () => apiClient.get("/v1/me");

export const getFeedIcon = async (id) => apiClient.get(`/v1/icons/${id}`);

export const getVersion = async () => apiClient.get("/v1/version");

export const markAllAsRead = async () => {
  const currentUser = await getCurrentUser();
  return apiClient.put(`/v1/users/${currentUser.data.id}/mark-all-as-read`);
};
