# 默认导航链接体检报告

- 生成时间：2026-11-25 03:29（本机时区）
- 工具：`scripts/check-links.mjs`（`npm run check:links`）
- 数据源：`src/config/navigation.ts` 默认数据（不含本地覆盖与用户自定义数据）
- 汇总：可达 19 · 存疑 2 · 失效 1 · 共 22

判定口径：可达 = 最终状态 2xx/3xx；存疑 = 401/403/429（多为站点对脚本或机房 IP 的拦截，人工用浏览器复核后再决定）；失效 = 其他 4xx、5xx、超时或网络错误。结果受运行环境的网络与地区影响，同一链接换个网络可能结论不同。

### 失效（1）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 后端 & DevOps | Vercel | https://vercel.com | AbortError | 10000 |  |

### 存疑（2）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | Stack Overflow | https://stackoverflow.com | 403 | 1216 | https://stackoverflow.com/ |
| 设计资源 | Unsplash | https://unsplash.com | 401 | 2015 | https://unsplash.com/.within.website?redir=%2F |

### 可达（19）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | ChatGPT | https://chat.openai.com | 200 | 2070 | https://chatgpt.com/ |
| 常用工具 | Google | https://www.google.com | 200 | 1133 | https://www.google.com/ |
| 常用工具 | GitHub | https://github.com | 200 | 6280 | https://github.com/ |
| 前端开发 | Vue.js | https://vuejs.org | 200 | 1189 | https://vuejs.org/ |
| 前端开发 | React | https://react.dev | 200 | 917 | https://react.dev/ |
| 前端开发 | TailwindCSS | https://tailwindcss.com | 200 | 728 | https://tailwindcss.com/ |
| 前端开发 | TypeScript | https://www.typescriptlang.org | 200 | 838 | https://www.typescriptlang.org/ |
| 前端开发 | Vite | https://vitejs.dev | 200 | 1576 | https://vite.dev/ |
| 前端开发 | MDN Web Docs | https://developer.mozilla.org | 200 | 1252 | https://developer.mozilla.org/en-US/ |
| 设计资源 | Figma | https://www.figma.com | 200 | 1394 | https://www.figma.com/ |
| 设计资源 | Dribbble | https://dribbble.com | 202 | 844 | https://dribbble.com/ |
| 设计资源 | Iconify | https://iconify.design | 200 | 773 | https://iconify.design/ |
| 后端 & DevOps | Docker Hub | https://hub.docker.com | 200 | 552 | https://hub.docker.com/ |
| 后端 & DevOps | Nginx | https://nginx.org | 200 | 2741 | https://nginx.org/ |
| 后端 & DevOps | Node.js | https://nodejs.org | 200 | 1172 | https://nodejs.org/en |
| 学习资源 | 掘金 | https://juejin.cn | 200 | 1214 | https://juejin.cn/ |
| 学习资源 | B站 | https://www.bilibili.com | 200 | 4074 | https://www.bilibili.com/zh-Hans |
| 学习资源 | LeetCode | https://leetcode.cn | 200 | 2628 | https://leetcode.cn/ |
| 学习资源 | Dev.to | https://dev.to | 200 | 862 | https://dev.to/ |
