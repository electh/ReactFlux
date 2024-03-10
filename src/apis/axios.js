import axios from "axios";
import { router } from "../index";

const thunder = axios.create({
  timeout: 10000,
});

// 添加请求拦截器
thunder.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    config.baseURL = localStorage.getItem("server");
    config.headers["X-Auth-Token"] = localStorage.getItem("token");
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
    if (error?.response?.status === 401) {
      localStorage.removeItem("server");
      localStorage.removeItem("token");
      router.navigate("/login");
    }
    return Promise.reject(error);
  },
);

export { thunder };
