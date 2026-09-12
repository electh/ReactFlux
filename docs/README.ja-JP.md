# ReactFlux

他の言語で読む: [Deutsch](README.de-DE.md), [English](../README.md), [Español](README.es-ES.md), [Français](README.fr-FR.md), [简体中文](README.zh-CN.md)

## 概要

ReactFlux は、より快適な読書体験の提供を目指して開発された [Miniflux](https://github.com/miniflux/v2) 向けのサードパーティ製 Web フロントエンドです。

対応 Miniflux バージョン: 2.3.2 以降。

主な機能:

- 洗練されたモダンなインターフェースデザイン
- タッチジェスチャーに対応したレスポンシブレイアウト
- ダークモードおよびカスタムテーマカラー対応
- カスタマイズ可能な読書体験:
  - フォントファミリーおよびフォントサイズの設定
  - 記事の横幅調整
  - タイトル配置のカスタマイズ
  - 拡大やスライドショーに対応した画像ビューアー
  - 脚注表示の拡張
  - ソースコードのシンタックスハイライト
  - 推定読了時間の表示
- 記事・フィード管理:
  - フレーズ一致、`OR` 検索、除外検索に対応した Miniflux 全文検索
  - 既読ステータスや公開日による記事の絞り込み
  - フィードの一括操作
  - 元記事の本文取得（全文取得）
  - ハッシュ、タイトル、URL による重複記事の除外
  - スクロール時の自動既読化
- 高度な機能:
  - カスタマイズ可能なキーボードショートカット
  - 絞り込んだ購読 URL のホスト一括置換（RSSHub インスタンス移行等に便利）
  - エラーが発生している購読フィードの一括更新
  - サードパーティサービスへの記事保存
- 多言語対応 (Deutsch / English / Español / Français / 日本語 / 简体中文)
- その他にも便利な機能が多数搭載されています…

## オンラインデモ・スクリーンショット

[オンラインデモ](https://reactflux.pages.dev) で ReactFlux をお試しいただけます。

さまざまなテーマでの外観:

![screenshot](../images/screenshot.png)
![devices](../images/devices.png)

## クイックスタート

1. 稼働中の Miniflux インスタンスを用意します
2. [オンラインデモ](https://reactflux.pages.dev) を直接利用するか、以下のいずれかの方法で ReactFlux をデプロイします
3. Miniflux のユーザー名とパスワード、または API トークン（推奨）を使用してログインします

## デプロイ

### Cloudflare Pages

ReactFlux は React で構築されており、ビルド後に静的 Web ファイル一式が生成されるため、Cloudflare Pages に直接デプロイ可能です。

Cloudflare Pages で `Framework preset` を `Create React App` に選択してデプロイできます。

### ビルド済みファイルを利用する

`gh-pages` ブランチからビルド済みファイルをダウンロードし、SPA（Single Page Application）に対応した任意の静的ホスティングサービスにデプロイできます。

`gh-pages` のファイルはこのリポジトリの GitHub Pages パス（`/ReactFlux/`）向けにビルドされています。別のパスで配信する場合は、後述の通り `VITE_BASE_PATH` を指定してソースからビルドしてください。

すべてのリクエストを `index.html` にリライトするよう設定してください。

Nginx でデプロイする場合の設定例:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Caddy でデプロイする場合の設定例:

```caddyfile
try_files {path} {path}/ /index.html
```

### サブパス配下へのデプロイ

公開パスはビルド時にフロントエンドバンドルに埋め込まれるため、変更する場合は再ビルドが必要です。`VITE_BASE_PATH` に `/`、または最初と最後が `/` で始まる絶対パス（例: `/reactflux/`）を指定します:

```bash
VITE_BASE_PATH=/reactflux/ pnpm run build
```

`build` ディレクトリの内容を同じ URL パスで配信し、SPA のディープリンクをそのパスの `index.html` にルーティングします。たとえば、ファイルが `/srv/reactflux` に配置されている場合、Caddy では以下のように設定します:

```caddyfile
root * /srv
try_files {path} {path}/ /reactflux/index.html
file_server
```

Docker イメージも同じパス用にビルドでき、バンドルされた Caddy 設定が自動的にファイルを配置・配信します:

```bash
docker build --build-arg VITE_BASE_PATH=/reactflux/ -t reactflux:subpath .
docker run -p 2000:2000 reactflux:subpath
# http://localhost:2000/reactflux/ を開く
```

リバースプロキシを使用する場合は、設定したプレフィックスを維持してください。

### Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/electh/ReactFlux)

### Docker

[![dockeri.co](https://dockerico.blankenship.io/image/electh/reactflux)](https://hub.docker.com/r/electh/reactflux)

```bash
docker run -p 2000:2000 electh/reactflux
```

または [Docker Compose](../docker-compose.yml) を使用する場合:

```bash
docker-compose up -d
```

## 翻訳ガイド

ReactFlux の翻訳にご協力いただける場合は、`locales` フォルダへの追加を行い、プルリクエストを送信してください。

また、対応する言語の README ファイルを追加し、既存のすべての README ファイルから参照リンクを追加する必要があります。

さらに、`Arco Design` および `Day.js` の多言語パッケージを組み込むため、ソースコードの一部を変更する必要があります。

詳細な変更内容については、[PR #145](https://github.com/electh/ReactFlux/pull/145) の変更例をご参照ください。

### 現在の翻訳者

| 言語     | 翻訳者                                          |
| -------- | ----------------------------------------------- |
| Deutsch  | [DonkeeeyKong](https://github.com/donkeeeykong) |
| Español  | [Victorhck](https://github.com/victorhck)       |
| Français | [MickGe](https://github.com/MickGe)             |
| 日本語   | [hogehige](https://github.com/hogehige2025)     |
| 简体中文 | [Neko Aria](https://github.com/NekoAria)        |

## コントリビューター

> このプロジェクトをより素晴らしいものにしてくださったすべてのコントリビューターに感謝します！

<a href="https://github.com/electh/ReactFlux/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=electh/ReactFlux" alt="Contributors for ReactFlux" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Star History

<a href="https://star-history.dera.page/#electh/ReactFlux">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://star-history.dera.page/svg?repos=electh/reactflux&amp;theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://star-history.dera.page/svg?repos=electh/reactflux" />
    <img alt="ReactFlux star history chart" src="https://star-history.dera.page/svg?repos=electh/reactflux" />
  </picture>
</a>
