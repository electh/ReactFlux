import { Message } from "@arco-design/web-react";
import axios from "axios";

import router from "../routes";
import { getAuth, isValidAuth } from "../utils/auth";

// 创建 axios 实例并设置默认配置
const apiClient = axios.create({
  timeout: 3000,
  retry: 3, // 默认重试次数
  retryDelay: 1000, // 默认重试间隔
});

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const auth = getAuth();
    const { server, token, username, password } = auth;
    if (!isValidAuth(auth)) {
      return Promise.reject(new Error("Invalid auth"));
    }

    config.baseURL = server;

    if (token) {
      config.headers["X-Auth-Token"] = token;
    } else {
      config.auth = { username, password };
    }

    // config.metadata = { url: config.url };

    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

const handleRetry = async (error) => {
  const { config } = error;
  // 检查是否配置了重试策略
  if (!config?.retry) {
    return Promise.reject(error);
  }

  // 设置重试次数的默认值
  config.__retryCount = config.__retryCount ?? 0;

  // 检查是否已经达到最大重试次数
  if (config.__retryCount >= config.retry) {
    return Promise.reject(error);
  }

  // 增加重试次数
  config.__retryCount += 1;

  // 创建一个新的 Promise 来处理重试延时
  const backoff = new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, config.retryDelay ?? 1000); // 重试间隔默认为 1 秒
  });

  // 等待再次尝试请求
  await backoff;
  return apiClient(config); // 返回重新尝试请求的 Promise
};

const handleError = (error) => {
  // 提取错误消息
  const errorMessage = error.response?.data?.error_message ?? error.message;
  // 显示错误消息
  Message.error(errorMessage);

  // 如果是 401 错误，清除认证信息并跳转到登录页面
  if (error.response?.status === 401) {
    localStorage.removeItem("auth");
    router.navigate("/login");
  }

  // 返回 Promise 拒绝状态
  return Promise.reject(error);
};

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么

    // console.trace(response.config.metadata.url);

    return response;
  },
  async (error) => {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    try {
      return await handleRetry(error);
    } catch (retryError) {
      // 重试失败或不满足重试条件时，处理错误
      return handleError(retryError);
    }
  },
);

export { apiClient };
