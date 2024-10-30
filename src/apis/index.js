import { apiClient } from "./ofetch";

export * from "./categories";
export * from "./entries";
export * from "./feeds";

export const getCurrentUser = async () => apiClient.get("/v1/me");

export const getFeedIcon = async (id) => apiClient.get(`/v1/icons/${id}`);

export const getIntegrationsStatus = async () =>
  apiClient.get("/v1/integrations/status");

export const getVersion = async () => apiClient.get("/v1/version");

export const markAllAsRead = async () => {
  const currentUser = await getCurrentUser();
  return apiClient.put(`/v1/users/${currentUser.id}/mark-all-as-read`);
};
