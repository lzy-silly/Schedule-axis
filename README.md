# 日程轴

把一段含时间和事件的文字交给 AI，自动拆成短条目，并按日期显示在时间轴上。

适合个人每天多次快速整理日程。界面为中文。解析结果只读，数据保存在当前浏览器的 localStorage。

## 功能

- 一次性粘贴日程原文，调用 OpenAI 兼容接口解析
- 按日期展示时间轴，默认今天，可前后切换或点选日期
- 同一天的新解析结果覆盖该日旧条目，其他日期保留
- 在页面中配置 Base URL、API Key、模型名，设置同样写入浏览器本地
- 可在本机运行，也可部署到 Cloudflare Pages

## 技术栈

- 前端：Vite + 原生 JavaScript
- 本机 API：Express（`/api/parse`）
- Cloudflare：Pages 静态资源 + Pages Functions

## 准备

- Node.js 18 或更高版本
- 一个 OpenAI 兼容接口的 Base URL、API Key 和模型名

常见 Base URL 示例：

- OpenAI 官方：`https://api.openai.com/v1`
- 其他兼容网关：填服务商文档中的 `/v1` 地址

## 本地开发

需要两个终端。Vite 会把 `/api` 代理到本机 `3001` 端口。

```bash
npm install
```

```bash
node server.js
```

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`。

首次使用先点「API 设置」，填入 Base URL、API Key、模型名并保存，再粘贴日程文本点「解析为时间轴」。

## 本机生产模式

构建前端后，由 Express 同时提供页面和 API：

```bash
npm install
npm run build
npm start
```

打开 `http://localhost:3001`。

## 部署到 Cloudflare Pages

项目已包含 Pages Functions：

- `functions/api/parse.js` 处理解析请求
- `wrangler.toml` 指定构建输出目录为 `dist`

### 控制台

1. 将仓库推送到 GitHub
2. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create → Pages
3. 连接该 Git 仓库
4. 构建配置：
   - Framework preset：`Vite`
   - Build command：`npm run build`
   - Build output directory：`dist`
5. 保存并部署

部署完成后访问 `https://<项目名>.pages.dev`。前端请求 `/api/parse` 时，由 Pages Functions 转发到你在页面里填写的模型接口。

### 命令行

```bash
npm install
npx wrangler login
npm run pages:deploy
```

## 使用说明

1. 打开应用，进入「API 设置」
2. 填写并保存 Base URL、API Key、模型名
3. 在「日程原文」中粘贴一段文字，例如：

   ```text
   明天下午 3 点开会，周五 09:30 去医院，今晚 20:00 跑步。
   ```

4. 点击「解析为时间轴」
5. 用日期切换查看不同天的条目

相对日期（今天、明天、周五等）按浏览器本地日期推算。只有时间没有日期时，记为今天；只有日期没有时刻时，时间为 `09:00`。

## 数据与隐私

- 日程条目保存在 `localStorage` 键 `schedule-timeline.todos`
- API 设置保存在 `localStorage` 键 `schedule-timeline.settings`
- 换浏览器、清站点数据或使用无痕窗口后，本地记录会消失
- API Key 只存在当前浏览器，不会写入仓库，也不会由 Cloudflare 持久保存
- 解析时，日程原文和 API Key 会发往你配置的模型服务

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（5173） |
| `node server.js` / `npm run server` | 启动本机解析 API（3001） |
| `npm run build` | 构建静态资源到 `dist/` |
| `npm start` | 用 Express 提供构建结果和 API |
| `npm run pages:dev` | 本地模拟 Cloudflare Pages |
| `npm run pages:deploy` | 构建并部署到 Cloudflare Pages |

## 目录结构

```text
.
├── functions/api/     Cloudflare Pages Functions
├── src/
│   ├── lib/parse.js   解析逻辑（本机与 Cloudflare 共用）
│   ├── main.js        前端交互
│   └── style.css
├── index.html
├── server.js          本机 Express 服务
├── vite.config.js
└── wrangler.toml
```

## 许可

个人使用。发布到 GitHub 时，可按需要自行补充 License 文件。
