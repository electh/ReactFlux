# ReactFlux

阅读其他语言版本： [English](README.md), [Español](README.es-ES.md)

## 概述

Reactflux 是 [Miniflux](https://github.com/miniflux/miniflux) 的第三方 Web 前端，旨在提供更加友好的阅读体验。

主要特性包括：

- 现代化的界面设计
- 响应式布局
- 支持黑暗模式和自定义主题
- 类 Google 搜索语法的文章和订阅源搜索功能
- 按发布日期过滤文章
- 订阅源及分组管理
- 快捷键支持（可自定义）
- 滚动时自动标记文章为已读
- 批量更新过滤后的订阅 URL 的 host（适用于替换 RSSHub 实例）
- 批量刷新最近更新错误的订阅源
- 文章列表加载时按 hash、标题或 URL 去重
- 多语言支持 (目前包括：English / Español / 简体中文)
- 保存文章到第三方服务
- 代码块语法高亮
- 其他功能等你来发现...

## 截图

![登录](images/login.png)
![布局](images/layout.png)
![设置](images/settings.png)

## 演示

[在线演示实例](https://reactflux.pages.dev/login)

## 部署

### Cloudflare Pages

Reactflux 使用 React 编写，构建完成后生成一组静态网页文件，可以直接使用部署在 Cloudflare Pages 上的演示站。

您也可以自行部署在 Cloudflare Pages 上，选择 ` 框架预设 ` 为 `Create React App` 即可。

### Vercel

[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Zeabur

[![部署到 Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W)

### Docker

```bash
docker run -p 2000:2000 electh/reactflux
```

## 配置

您需要一个可用的 Miniflux 实例来使用本项目，支持以下两种登录方式：

1. 使用实例用户名和密码登录（不推荐）；
2. 使用 Miniflux 的 token 登录，可在“Settings > API Keys > Create a new API key”中生成一个。

## 分支说明

- `main` 分支：提供最全面的功能，新功能通常会首先在该分支上发布，适合绝大多数用户使用。
- `next` 分支：最初为了提升移动设备兼容性而创建，为移动设备提供更好的体验和性能，同时也兼容桌面设备。该分支目前缺少键盘快捷键等功能，会有选择性地从 `main` 分支迁移后续功能。
- `gh-pages` 分支：用于 `main` 分支的构建和部署到 GitHub Pages。

如果您想快速体验 `next` 分支，这里有一个[在线实例](https://arcoflux.pages.dev/login)。

## 贡献者

> 感谢所有为这个项目做出贡献的人！

<table>
<tr>
    <td align="center">
        <a href="https://github.com/NekoAria">
            <img src="https://avatars.githubusercontent.com/u/23137034?v=4" width="90" alt="NekoAria" style="border-radius: 4px"/>
        </a>
        <br />
        <sub><b>NekoAria</b></sub>
        <br />
        <sub><b> 主要贡献者 </b></sub>
    </td>
    <td align="center">
        <a href="https://github.com/electh">
            <img src="https://avatars.githubusercontent.com/u/83588235?v=4" width="90" alt="electh" style="border-radius: 4px"/>
        </a>
        <br />
        <sub><b>electh</b></sub>
        <br />
        <sub><b> 项目发起人 </b></sub>
    </td>
</tr>
</table>

## 星标历史

[![星标历史](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
