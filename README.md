# ReactFlux

Read in other languages: [Español](README.es-ES.md), [Français](README.fr-FR.md), [简体中文](README.zh-CN.md)

## Overview

ReactFlux is a third-party web frontend for [Miniflux](https://github.com/miniflux/v2), aimed at providing a more user-friendly reading experience.

Key features include:

- Modern interface design
- Responsive layout
- Support for dark mode and custom themes
- Article and feed search with Google-like syntax
- Filter articles by publish date
- Feed and group management
- Keyboard shortcuts (customizable)
- Automatically mark articles as read when scrolling
- Batch update the host of filtered subscription URLs (useful for replacing RSSHub instances)
- Batch refresh recently errored subscriptions
- De-duplicate articles by hash, title, or URL when loading the list
- I18n supports (include: English / Español / 简体中文)
- Save article to third-party services
- Syntax highlighting for code blocks
- Other features waiting for you to discover...

## Online Demo & Screenshots

Try ReactFlux with our [online demo instance](https://reactflux.pages.dev).

See how ReactFlux looks in different themes:

![Light Mode](images/light.png)
![Dark Mode](images/dark.png)

## Quick Start

1. Ensure you have a working Miniflux instance
2. Directly use our [online demo instance](https://reactflux.pages.dev) or deploy ReactFlux using one of the methods below
3. Log in using your Miniflux username and password or API key (recommended)

## Deployment

### Cloudflare Pages

ReactFlux is built with React and generates a set of static web files after building, which can be directly deployed on Cloudflare Pages.

You can deploy it on Cloudflare Pages by selecting `Framework preset` as `Create React App`.

### Using Pre-built Files

You can download the pre-built files from the `gh-pages` branch and deploy them to any static hosting service that supports single-page applications (SPA).

Make sure to configure URL rewriting to redirect all requests to `index.html`.

If you are deploying using Nginx, you might need to add the following configuration:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Zeabur

[![Deploy to Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/OKXO3W)

### Docker

```bash
docker run -p 2000:2000 electh/reactflux
```

## Translation Guide

To help us translate ReactFlux into your language, please contribute to the `locales` folder and send a pull request.

Additionally, you need to add a README file for the respective language and reference it in all existing README files.

You should also modify parts of the source code to include the i18n language packages for `Arco Design` and `Day.js`.

For detailed changes, please refer to the modifications in [PR #120](https://github.com/electh/ReactFlux/pull/120).

### Current Translators

- Español by [Victorhck](https://github.com/victorhck)
- Français by [MickGe](https://github.com/MickGe)
- 简体中文 by [Neko Aria](https://github.com/NekoAria)

## Contributors

> Thanks to all the contributors who have made this project more awesome!

<a href="https://github.com/electh/ReactFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=electh/ReactFlux" alt="Contributors for ReactFlux" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Star History

[![Star History](https://starchart.cc/electh/ReactFlux.svg)](https://starchart.cc/electh/ReactFlux)
