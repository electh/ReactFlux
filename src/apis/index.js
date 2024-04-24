import { apiClient } from "./axios";

export * from "./categories";
export * from "./entries";
export * from "./feeds";

export const getCurrentUser = async () => apiClient.get("/v1/me");

export const markAllAsRead = async () => {
  const currentUser = await getCurrentUser();
  return apiClient.put(`/v1/users/${currentUser.data.id}/mark-all-as-read`);
};
