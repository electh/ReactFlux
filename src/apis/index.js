import apiClient from "./ofetch"

export * from "./categories"
export * from "./entries"
export * from "./feeds"

export const exportOPML = async () => apiClient.get("/v1/export")

export const importOPML = (xmlContent) =>
  apiClient.raw("/v1/import", {
    method: "POST",
    body: xmlContent,
  })

export const getCurrentUser = async () => apiClient.get("/v1/me")

export const getFeedIcon = async (id) => apiClient.get(`/v1/icons/${id}`)

export const getIntegrationsStatus = async () => apiClient.get("/v1/integrations/status")

export const getVersion = async () => apiClient.get("/v1/version")

export const markAllAsRead = async () => {
  const currentUser = await getCurrentUser()
  return apiClient.put(`/v1/users/${currentUser.id}/mark-all-as-read`)
}

export const saveEnclosureProgression = async (
  enclosureId,
  progress, // enclosureId: number, progress: number
) => apiClient.put(`/v1/enclosures/${enclosureId}`, { media_progression: progress })
