## ReactFlux

### 概述

Reactflux 是 [miniflux](https://github.com/miniflux/miniflux) 的第三方 Web 前端，提供了更为友好的阅读体验。

### 截图

![login](https://github.com/electh/ReactFlux/raw/main/src/imgs/login.png)
![light](https://github.com/electh/ReactFlux/raw/main/src/imgs/light.png)
![dark](https://github.com/electh/ReactFlux/raw/main/src/imgs/dark.png)

### 演示

[hosted instance](https://reactflux.pages.dev/login)

### 部署

#### Cloudflare Pages

Reactflux 使用 React 编写，build 之后只是一堆静态网页文件，可以直接使用部署在 Cloudflare Pages 上的演示站。

或者你可以自行部署在 Cloudflare Pages 上，`框架预设`选择`Create React App`即可。

#### Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### 配置

你需要一个可用的 miniflux 实例来使用本项目，Server Address 请填写实例地址，API Token 请填写实例 token，可在“Settings > API Keys > Create a new API key”生成一个。
