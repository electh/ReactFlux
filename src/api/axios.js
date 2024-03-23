import { Message } from "@arco-design/web-react";
import axios from "axios";

import { router } from "../router/router";
import { getAuth } from "../utils/auth";

const thunder = axios.create({
  timeout: 30000,
});

// 添加请求拦截器
thunder.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const auth = getAuth();
    const secret = auth?.secret || {};
    const { server, token, username, password } = secret;

    config.baseURL = server;

    if (token) {
      config.headers["X-Auth-Token"] = token;
    }

    if (username || password) {
      config.auth = {
        ...config.auth,
        ...(username && { username }),
        ...(password && { password }),
      };
    }

    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

// 添加响应拦截器
thunder.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    console.error(error);
    Message.error(error.response?.data?.error_message || error.message);

    if (error.response?.status === 401) {
      localStorage.clear();
      router.navigate("/login");
    }

    return Promise.reject(error);
  },
);

export { thunder };
