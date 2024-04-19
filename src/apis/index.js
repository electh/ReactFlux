import { apiClient } from "./axios";

export * from "./categories";
export * from "./entries";
export * from "./feeds";

export const getCurrentUser = async () => apiClient.get("/v1/me");
