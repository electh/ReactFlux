# 字体本地化说明

## 已本地化的字体

本项目已将 Google Fonts 完全本地化，所有字体文件存储在 `public/fonts/` 目录下：

- **Fira Sans** - `public/fonts/firasans/`
- **Noto Sans** - `public/fonts/notosans/`
- **Noto Serif** - `public/fonts/notoserif/`
- **Open Sans** - `public/fonts/opensans/`
- **Source Sans Pro** - `public/fonts/sourcesanspro/`
- **Source Serif Pro** - `public/fonts/sourceserifpro/`

## 文件结构

```
public/
├── fonts/
│   ├── firasans/       # 7 个 woff2 文件
│   ├── notosans/       # 8 个 woff2 文件
│   ├── notoserif/      # 8 个 woff2 文件
│   ├── opensans/       # 10 个 woff2 文件
│   ├── sourcesanspro/  # 7 个 woff2 文件
│   └── sourceserifpro/ # 6 个 woff2 文件
└── styles/
    └── fonts.css       # 字体定义文件
```

## 优势

✅ **完全离线**：不依赖任何外部 CDN
✅ **更快加载**：无需 DNS 查询和跨域请求
✅ **网络无忧**：在网络受限地区也能正常显示
✅ **隐私保护**：不会向第三方发送请求
✅ **版本稳定**：字体版本固定，不受外部更新影响

## 字体格式

所有字体文件均为 **woff2** 格式，这是目前最优化的 Web 字体格式：

- 文件体积小（相比 woff 减少约 30%）
- 所有现代浏览器都支持
- 包含多种语言支持（拉丁、西里尔、希腊、越南语等）

## 总大小

所有字体文件总计约 **704KB**，包含 **46 个字体文件**。

## 维护

如需更新字体或添加新字体：

1. 访问 [Google Fonts](https://fonts.google.com/)
2. 选择所需字体和字重
3. 使用 [google-webfonts-helper](https://gwfh.mranftl.com/) 下载字体文件
4. 将 woff2 文件放入对应目录
5. 更新 `public/styles/fonts.css` 中的 @font-face 规则
