import { Message } from "@arco-design/web-react";
import axios from "axios";

import router from "../routes";
import { getAuth } from "../utils/auth";

const apiClient = axios.create({
  timeout: 5000,
});

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const auth = getAuth();
    const { server, token, username, password } = auth?.secret || {};

    config.baseURL = server;

    if (token) {
      config.headers["X-Auth-Token"] = token;
    }

    if (username && password) {
      config.auth = { username, password };
    }

    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    console.error(error);
    const errorMessage = error.response?.data?.error_message || error.message;
    Message.error(errorMessage);

    if (error.response?.status === 401) {
      localStorage.removeItem("auth");
      router.navigate("/login");
    }

    return Promise.reject(error);
  },
);

export { apiClient };
