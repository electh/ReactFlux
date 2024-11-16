# ReactFlux

阅读其他语言版本： [English](../README.md), [Español](README.es-ES.md), [Français](README.fr-FR.md)

## 概述

ReactFlux 是 [Miniflux](https://github.com/miniflux/v2) 的第三方 Web 前端，旨在提供更加友好的阅读体验。

主要特性包括：

- 现代化的界面设计
- 响应式布局，支持手势操作
- 支持黑暗模式和自定义主题
- 可自定义的阅读体验：
  - 字体样式和大小设置
  - 文章宽度调整
  - 标题对齐选项
  - 带缩放和幻灯片功能的图片查看器
  - 脚注增强
  - 代码语法高亮
  - 预计阅读时间
- 文章和订阅源管理：
  - 类 Google 搜索语法
  - 按阅读状态、发布日期、标题、内容或作者过滤文章
  - 订阅源批量操作
  - 全文获取支持
  - 按 hash、标题或 URL 去重文章
  - 滚动时自动标记文章为已读
- 高级功能：
  - 快捷键支持（可自定义）
  - 批量更新过滤后的订阅 URL 的 host（适用于替换 RSSHub 实例）
  - 批量刷新最近更新错误的订阅源
  - 保存文章到第三方服务
- 多语言支持 (English / Español / Français / 简体中文)
- 其他功能等您来发现...

## 在线演示和截图

试用 ReactFlux 的 [在线演示实例](https://reactflux.pages.dev)。

查看 ReactFlux 在不同主题下的外观：

![screenshot](../images/screenshot.png)
![devices](../images/devices.png)

## 快速开始

1. 确保您有一个正常运行的 Miniflux 实例
2. 直接使用我们的 [在线演示实例](https://reactflux.pages.dev) 或使用以下方法之一部署 ReactFlux
3. 使用您的 Miniflux 用户名和密码或 API 密钥（推荐）登录

## 部署

### Cloudflare Pages

ReactFlux 使用 React 编写，构建完成后生成一组静态网页文件，可以直接部署在 Cloudflare Pages 上。

您可以通过选择 `Framework preset` 为 `Create React App` 来将其部署在 Cloudflare Pages 上。

### 使用预构建文件

您可以从 `gh-pages` 分支下载预构建文件，并将它们部署到任何支持单页应用程序 (SPA) 的静态托管服务。

确保配置 URL 重写，将所有请求重定向到 `index.html`。

如果您使用 Nginx 部署，可能需要添加以下配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel

[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Docker

[![dockeri.co](https://dockerico.blankenship.io/image/electh/reactflux)](https://hub.docker.com/r/electh/reactflux)

```bash
docker run -p 2000:2000 electh/reactflux
```

或者使用 [Docker Compose](docker-compose.yml)：

```bash
docker-compose up -d
```

<!-- ### Zeabur（已过时，不推荐）

[![部署到 Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W) -->

## 翻译指南

为了帮助我们将 ReactFlux 翻译成您的语言，请贡献到 `locales` 文件夹并发送 pull request。

此外，您需要为相应的语言添加一个 README 文件，并在所有现有的 README 文件中引用它。

您还需要修改部分源代码，以包含 `Arco Design` 和 `Day.js` 的 i18n 语言包。

有关详细的更改，请参阅 [PR #120](https://github.com/electh/ReactFlux/pull/120) 中的修改。

### 当前翻译者

- Español by [Victorhck](https://github.com/victorhck)
- Français by [MickGe](https://github.com/MickGe)
- 简体中文 by [Neko Aria](https://github.com/NekoAria)

## 贡献者

> 感谢所有让这个项目变得更加出色的贡献者！

<a href="https://github.com/electh/ReactFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=electh/ReactFlux" alt="ReactFlux 的贡献者们" />
</a>

使用 [contrib.rocks](https://contrib.rocks) 生成。

## 星标历史

[![星标历史](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
