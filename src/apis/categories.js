import apiClient from "./ofetch"

export const getCategories = async () => apiClient.get("/v1/categories")

export const addCategory = async (title) => apiClient.post("/v1/categories", { title })

export const deleteCategory = async (id) =>
  apiClient.raw(`/v1/categories/${id}`, { method: "DELETE" })

export const updateCategory = async (id, newTitle, hidden = false) => {
  const params = { title: newTitle, hide_globally: hidden ? "on" : undefined }
  return apiClient.put(`/v1/categories/${id}`, params)
}

export const markCategoryAsRead = async (id) =>
  apiClient.put(`/v1/categories/${id}/mark-all-as-read`)
