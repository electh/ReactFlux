import axios from "axios";

import router from "../routes";
import { getAuth, isValidAuth } from "../utils/auth";

// 创建 axios 实例并设置默认配置
const apiClient = axios.create({
  timeout: 5000,
  retry: 3, // 默认重试次数
  retryDelay: 1000, // 默认重试间隔
});

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const auth = getAuth();
    if (!isValidAuth(auth)) {
      return Promise.reject(new Error("Invalid auth"));
    }

    const { server, token, username, password } = auth;
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

// 判断是否需要重试
const shouldRetry = (error) => {
  const statusCode = error.response?.status;
  return (
    error.code === "ECONNABORTED" || (statusCode >= 500 && statusCode < 600)
  );
};

// 错误处理和重试
const onError = async (error) => {
  if (!shouldRetry(error)) {
    return Promise.reject(error);
  }

  const { config } = error;

  if (error.code === "ECONNABORTED") {
    config.timeout *= 2;
  }

  config.retryCount = config.retryCount || 0;
  if (config.retryCount >= config.retry) {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth");
      await router.navigate("/login");
    }
    return Promise.reject(error);
  }

  config.retryCount += 1;
  const statusCode = error.response?.status;
  if (statusCode >= 500 && statusCode < 600) {
    const delay = config.retryDelay * 2 ** config.retryCount;
    console.log(`Retry attempt ${config.retryCount}: waiting for ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  } else {
    console.log(`Retry attempt ${config.retryCount}`);
  }
  return apiClient(config);
};

const handleError = async (error) => {
  // 提取错误消息
  const errorMessage = error.response?.data?.error_message ?? error.message;
  // 显示错误消息
  console.log(errorMessage);

  // 如果是 401 错误，清除认证信息并跳转到登录页面
  if (error.response?.status === 401) {
    localStorage.removeItem("auth");
    await router.navigate("/login");
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
      return await onError(error);
    } catch (retryError) {
      // 重试失败或不满足重试条件时，处理错误
      return handleError(retryError);
    }
  },
);

export { apiClient };
