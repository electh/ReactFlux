import axios from "axios";
import { Message } from "@arco-design/web-react";

const thunder = axios.create({
  timeout: 5000,
});

// 添加请求拦截器
thunder.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    config.baseURL = "https://rss.electh.top";
    config.auth = {
      username: "admin",
      password: "123456",
    };
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

// 添加响应拦截器
thunder.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    console.error(error);
    Message.error(error.response?.data?.error_message || error.message);

    return Promise.reject(error);
  },
);

export { thunder };
