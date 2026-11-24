# 默认导航链接体检报告

- 生成时间：2026-11-25 05:32（本机时区）
- 工具：`scripts/check-links.mjs`（`npm run check:links`）
- 数据源：`src/config/navigation.ts` 默认数据（不含本地覆盖与用户自定义数据）
- 汇总：可达 39 · 存疑 6 · 失效 6 · 共 51

判定口径：可达 = 最终状态 2xx/3xx；存疑 = 401/403/429（多为站点对脚本或机房 IP 的拦截，人工用浏览器复核后再决定）；失效 = 其他 4xx、5xx、超时或网络错误。结果受运行环境的网络与地区影响，同一链接换个网络可能结论不同。

### 失效（6）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| AI 工具 | Gemini | https://gemini.google.com | UND_ERR_SOCKET | 10000 |  |
| AI 工具 | 通义千问 | https://tongyi.aliyun.com/qianwen | AbortError | 10000 |  |
| 后端 & DevOps | Vercel | https://vercel.com | TypeError | 10000 |  |
| 云服务 | Microsoft Azure | https://azure.microsoft.com | AbortError | 10000 |  |
| 效率工具 | Todoist | https://todoist.com | AbortError | 10000 |  |
| 影音娱乐 | 小红书 | https://www.xiaohongshu.com | 404 | 1184 | https://www.xiaohongshu.com/ |

### 存疑（6）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | Stack Overflow | https://stackoverflow.com | 403 | 930 | https://stackoverflow.com/ |
| AI 工具 | DeepSeek | https://chat.deepseek.com | 403 | 741 | https://chat.deepseek.com/ |
| AI 工具 | Poe | https://poe.com | 403 | 828 | https://poe.com/ |
| 设计资源 | Unsplash | https://unsplash.com | 401 | 1374 | https://unsplash.com/.within.website?redir=%2F |
| 效率工具 | Canva | https://www.canva.com | 403 | 328 | https://www.canva.com/ |
| 学习资源 | LeetCode | https://leetcode.cn | 403 | 486 | https://leetcode.cn/ |

### 可达（39）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | ChatGPT | https://chat.openai.com | 200 | 1912 | https://chatgpt.com/ |
| 常用工具 | Google | https://www.google.com | 200 | 988 | https://www.google.com/ |
| 常用工具 | GitHub | https://github.com | 200 | 961 | https://github.com/ |
| AI 工具 | Claude | https://claude.ai | 200 | 1689 | https://claude.ai/login |
| AI 工具 | Perplexity | https://www.perplexity.ai | 200 | 779 | https://www.perplexity.ai/ |
| AI 工具 | Hugging Face | https://huggingface.co | 200 | 829 | https://huggingface.co/ |
| 前端开发 | Vue.js | https://vuejs.org | 200 | 844 | https://vuejs.org/ |
| 前端开发 | React | https://react.dev | 200 | 534 | https://react.dev/ |
| 前端开发 | TailwindCSS | https://tailwindcss.com | 200 | 816 | https://tailwindcss.com/ |
| 前端开发 | TypeScript | https://www.typescriptlang.org | 200 | 464 | https://www.typescriptlang.org/ |
| 前端开发 | Vite | https://vitejs.dev | 200 | 1207 | https://vite.dev/ |
| 前端开发 | MDN Web Docs | https://developer.mozilla.org | 200 | 1103 | https://developer.mozilla.org/en-US/ |
| 设计资源 | Figma | https://www.figma.com | 200 | 1097 | https://www.figma.com/ |
| 设计资源 | Dribbble | https://dribbble.com | 202 | 685 | https://dribbble.com/ |
| 设计资源 | Iconify | https://iconify.design | 200 | 855 | https://iconify.design/ |
| 后端 & DevOps | Docker Hub | https://hub.docker.com | 200 | 729 | https://hub.docker.com/ |
| 后端 & DevOps | Nginx | https://nginx.org | 200 | 1837 | https://nginx.org/ |
| 后端 & DevOps | Node.js | https://nodejs.org | 200 | 1475 | https://nodejs.org/en |
| 云服务 | AWS | https://aws.amazon.com | 200 | 687 | https://aws.amazon.com/ |
| 云服务 | Google Cloud | https://cloud.google.com | 200 | 955 | https://cloud.google.com/ |
| 云服务 | 阿里云 | https://www.aliyun.com | 200 | 889 | https://www.aliyun.com/ |
| 云服务 | Cloudflare | https://www.cloudflare.com | 200 | 662 | https://www.cloudflare.com/ |
| 云服务 | Supabase | https://supabase.com | 200 | 695 | https://supabase.com/ |
| 效率工具 | Notion | https://www.notion.com | 200 | 416 | https://www.notion.com/ |
| 效率工具 | Obsidian | https://obsidian.md | 200 | 473 | https://obsidian.md/ |
| 效率工具 | DeepL | https://www.deepl.com | 200 | 1229 | https://www.deepl.com/en |
| 效率工具 | Google Drive | https://drive.google.com | 200 | 2411 | https://accounts.google.com/v3/signin/identifier?continue=https://drive.google.com/&emr=1&followup=https://drive.google.com/&osid=1&passive=1209600&service=wise&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-2063440311:1795555913152919 |
| 学习资源 | 掘金 | https://juejin.cn | 200 | 1423 | https://juejin.cn/ |
| 学习资源 | B站 | https://www.bilibili.com | 200 | 2205 | https://www.bilibili.com/zh-Hans |
| 学习资源 | Dev.to | https://dev.to | 200 | 515 | https://dev.to/ |
| 学习资源 | Wikipedia | https://www.wikipedia.org | 200 | 594 | https://www.wikipedia.org/ |
| 学习资源 | Coursera | https://www.coursera.org | 200 | 750 | https://www.coursera.org/ |
| 影音娱乐 | YouTube | https://www.youtube.com | 200 | 646 | https://www.youtube.com/ |
| 影音娱乐 | Netflix | https://www.netflix.com | 200 | 701 | https://www.netflix.com/ |
| 影音娱乐 | Spotify | https://www.spotify.com | 200 | 1167 | https://open.spotify.com/ |
| 影音娱乐 | Twitch | https://www.twitch.tv | 200 | 395 | https://www.twitch.tv/ |
| 影音娱乐 | 豆瓣 | https://www.douban.com | 200 | 2012 | https://www.douban.com/ |
| 影音娱乐 | Steam | https://store.steampowered.com | 200 | 1135 | https://store.steampowered.com/ |
| 影音娱乐 | 网易云音乐 | https://music.163.com | 200 | 1367 | https://music.163.com/ |
