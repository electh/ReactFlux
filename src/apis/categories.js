import apiClient from "./ofetch"

import { dataState } from "@/store/dataState"
import compareVersions from "@/utils/version"

export const getCategories = async () => apiClient.get("/v1/categories")

export const refreshCategoryFeed = async (id) =>
  apiClient.raw(`/v1/categories/${id}/refresh`, { method: "PUT" })

export const addCategory = async (title) => apiClient.post("/v1/categories", { title })

export const deleteCategory = async (id) =>
  apiClient.raw(`/v1/categories/${id}`, { method: "DELETE" })

export const updateCategory = async (id, newTitle, hidden = false) => {
  const { version } = dataState.get()

  let hide_globally

  if (compareVersions(version, "2.2.8") >= 0) {
    hide_globally = hidden
  } else {
    hide_globally = hidden ? "on" : undefined
  }

  const params = { title: newTitle, hide_globally }
  return apiClient.put(`/v1/categories/${id}`, params)
}

export const markCategoryAsRead = async (id) =>
  apiClient.put(`/v1/categories/${id}/mark-all-as-read`)
