## ReactFlux

### 概述

Reactflux 是 [Miniflux](https://github.com/miniflux/miniflux) 的第三方 Web 前端，提供了更为友好的阅读体验。
* 现代化的界面
* 响应式设计
* 支持黑暗模式
* 全文搜索
* 订阅源及分组管理

### 截图

![large](https://github.com/electh/ReactFlux/raw/main/src/imgs/large.png)
![medium](https://github.com/electh/ReactFlux/raw/main/src/imgs/medium.png)
![mini](https://github.com/electh/ReactFlux/raw/main/src/imgs/mini.png)
![settings](https://github.com/electh/ReactFlux/raw/main/src/imgs/settings.png)

### 演示

[hosted instance](https://reactflux.pages.dev/login)

### 部署

#### Cloudflare Pages

Reactflux 使用 React 编写，build 之后只是一堆静态网页文件，可以直接使用部署在 Cloudflare Pages 上的演示站。

或者你可以自行部署在 Cloudflare Pages 上，`框架预设`选择`Create React App`即可。

#### Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

#### Zeabur

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W)

### 配置

你需要一个可用的 Miniflux 实例来使用本项目，Server Address 请填写实例地址，API Token 请填写实例 token，可在“Settings > API Keys > Create a new API key”生成一个。
