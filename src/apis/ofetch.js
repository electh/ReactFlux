import { ofetch } from "ofetch";

import router from "../routes";
import { getAuth, isValidAuth } from "../utils/auth";

// 创建 ofetch 实例并设置默认配置
const createApiClient = () => {
  return ofetch.create({
    retry: 3, // 默认重试次数
    onRequest({ request, options }) {
      const auth = getAuth();
      if (!isValidAuth(auth)) {
        throw new Error("Invalid auth");
      }
      const { server, token, username, password } = auth;
      options.baseURL = server;
      options.headers = token
        ? { "X-Auth-Token": token }
        : { Authorization: `Basic ${btoa(`${username}:${password}`)}` };
    },
    onRequestError({ request, options, error }) {
      // 处理请求错误
      console.error("Request error: ", error);
    },
    async onResponseError({ request, response, options }) {
      const statusCode = response.status;
      if (statusCode === 401) {
        localStorage.removeItem("auth");
        await router.navigate("/login");
      }
      // 处理响应错误
      const errorMessage = response._data?.error_message ?? response.statusText;
      console.error("Response error: ", errorMessage);
      throw new Error(errorMessage);
    },
  });
};

const apiClient = createApiClient();
apiClient.get = (url) => apiClient(url, { method: "GET" });
apiClient.post = (url, body) => apiClient(url, { method: "POST", body });
apiClient.put = (url, body) => apiClient(url, { method: "PUT", body });

export { apiClient };
