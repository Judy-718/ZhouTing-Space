# Portfolio（纯静态版）

这是一个不依赖 npm 的静态作品集模板：**自定义头像鼠标** + **按项目定制的进入转场**。

## 本地预览

### 方式 1：直接打开（最快）

直接双击 `index.html` 用浏览器打开即可（`file://`）。

### 方式 2：用 Node 跑本地服务器（推荐）

在 `portfolio/` 目录运行：

```bash
node ./serve.mjs
```

然后打开终端输出的本地地址（通常是 `http://127.0.0.1:4173`）。

## 你要改的地方

- `index.html` / `about.html` / `work/project-*.html`：文案、链接、项目名称
- `assets/avatar.svg`：换成你的抽象头像（SVG/PNG 都可以）
- 图片：把每个 `.shot` / `.card__media` 换成真实图片（建议 WebP）

## 交互配置（每个项目都可以不一样）

首页每个项目卡片上有：

- `data-accent`：主色（会影响 hover、转场、页面氛围）
- `data-transition`：进入动效（`iris` / `wipe` / `shard` / `pulse`）

