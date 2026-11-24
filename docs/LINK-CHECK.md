# 默认导航链接体检报告

- 生成时间：2026-11-25 07:22（本机时区）
- 工具：`scripts/check-links.mjs`（`npm run check:links`）
- 数据源：`src/config/navigation.ts` 默认数据（不含本地覆盖与用户自定义数据）
- 汇总：可达 55 · 存疑 8 · 失效 5 · 共 68

判定口径：可达 = 最终状态 2xx/3xx；存疑 = 401/403/429（多为站点对脚本或机房 IP 的拦截，人工用浏览器复核后再决定）；失效 = 其他 4xx、5xx、超时或网络错误。结果受运行环境的网络与地区影响，同一链接换个网络可能结论不同。

### 失效（5）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| AI 工具 | Gemini | https://gemini.google.com | UND_ERR_SOCKET | 10000 |  |
| AI 工具 | 通义千问 | https://tongyi.aliyun.com/qianwen | AbortError | 10000 |  |
| 后端 & DevOps | Vercel | https://vercel.com | AbortError | 10000 |  |
| 云服务 | Microsoft Azure | https://azure.microsoft.com | AbortError | 10000 |  |
| 影音娱乐 | 小红书 | https://www.xiaohongshu.com | 404 | 1217 | https://www.xiaohongshu.com/ |

### 存疑（8）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | Stack Overflow | https://stackoverflow.com | 403 | 860 | https://stackoverflow.com/ |
| AI 工具 | DeepSeek | https://chat.deepseek.com | 403 | 904 | https://chat.deepseek.com/ |
| AI 工具 | Poe | https://poe.com | 403 | 590 | https://poe.com/ |
| AI 工具 | Midjourney | https://www.midjourney.com | 403 | 532 | https://www.midjourney.com/ |
| 设计资源 | Unsplash | https://unsplash.com | 401 | 1491 | https://unsplash.com/.within.website?redir=%2F |
| 设计资源 | Pexels | https://www.pexels.com | 403 | 762 | https://www.pexels.com/ |
| 效率工具 | Canva | https://www.canva.com | 403 | 368 | https://www.canva.com/ |
| 学习资源 | LeetCode | https://leetcode.cn | 403 | 852 | https://leetcode.cn/ |

### 可达（55）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | ChatGPT | https://chat.openai.com | 200 | 2080 | https://chatgpt.com/ |
| 常用工具 | Google | https://www.google.com | 200 | 899 | https://www.google.com/ |
| 常用工具 | GitHub | https://github.com | 200 | 929 | https://github.com/ |
| 常用工具 | 百度 | https://www.baidu.com | 200 | 1760 | https://www.baidu.com/ |
| AI 工具 | Claude | https://claude.ai | 200 | 1036 | https://claude.ai/login |
| AI 工具 | Perplexity | https://www.perplexity.ai | 200 | 920 | https://www.perplexity.ai/ |
| AI 工具 | Hugging Face | https://huggingface.co | 200 | 569 | https://huggingface.co/ |
| AI 工具 | Cursor | https://www.cursor.com | 200 | 1528 | https://cursor.com/ |
| 前端开发 | Vue.js | https://vuejs.org | 200 | 710 | https://vuejs.org/ |
| 前端开发 | React | https://react.dev | 200 | 678 | https://react.dev/ |
| 前端开发 | TailwindCSS | https://tailwindcss.com | 200 | 575 | https://tailwindcss.com/ |
| 前端开发 | TypeScript | https://www.typescriptlang.org | 200 | 625 | https://www.typescriptlang.org/ |
| 前端开发 | Vite | https://vitejs.dev | 200 | 1498 | https://vite.dev/ |
| 前端开发 | MDN Web Docs | https://developer.mozilla.org | 200 | 1200 | https://developer.mozilla.org/en-US/ |
| 前端开发 | Next.js | https://nextjs.org | 200 | 580 | https://nextjs.org/ |
| 前端开发 | Nuxt | https://nuxt.com | 200 | 566 | https://nuxt.com/ |
| 设计资源 | Figma | https://www.figma.com | 200 | 1240 | https://www.figma.com/ |
| 设计资源 | Dribbble | https://dribbble.com | 202 | 932 | https://dribbble.com/ |
| 设计资源 | Iconify | https://iconify.design | 200 | 887 | https://iconify.design/ |
| 设计资源 | Behance | https://www.behance.net | 200 | 2424 | https://www.behance.net/ |
| 后端 & DevOps | Docker Hub | https://hub.docker.com | 200 | 619 | https://hub.docker.com/ |
| 后端 & DevOps | Nginx | https://nginx.org | 200 | 1589 | https://nginx.org/ |
| 后端 & DevOps | Node.js | https://nodejs.org | 200 | 1333 | https://nodejs.org/en |
| 后端 & DevOps | Kubernetes | https://kubernetes.io | 200 | 503 | https://kubernetes.io/ |
| 后端 & DevOps | PostgreSQL | https://www.postgresql.org | 200 | 560 | https://www.postgresql.org/ |
| 后端 & DevOps | Redis | https://redis.io | 200 | 789 | https://redis.io/ |
| 云服务 | AWS | https://aws.amazon.com | 200 | 675 | https://aws.amazon.com/ |
| 云服务 | Google Cloud | https://cloud.google.com | 200 | 1007 | https://cloud.google.com/ |
| 云服务 | 阿里云 | https://www.aliyun.com | 200 | 1013 | https://www.aliyun.com/ |
| 云服务 | Cloudflare | https://www.cloudflare.com | 200 | 632 | https://www.cloudflare.com/ |
| 云服务 | Supabase | https://supabase.com | 200 | 499 | https://supabase.com/ |
| 云服务 | 腾讯云 | https://cloud.tencent.com | 200 | 1147 | https://cloud.tencent.com/ |
| 效率工具 | Notion | https://www.notion.com | 200 | 454 | https://www.notion.com/ |
| 效率工具 | Obsidian | https://obsidian.md | 200 | 426 | https://obsidian.md/ |
| 效率工具 | DeepL | https://www.deepl.com | 200 | 1146 | https://www.deepl.com/en |
| 效率工具 | Todoist | https://todoist.com | 200 | 1455 | https://www.todoist.com/ |
| 效率工具 | Google Drive | https://drive.google.com | 200 | 1795 | https://accounts.google.com/v3/signin/identifier?continue=https://drive.google.com/&emr=1&followup=https://drive.google.com/&osid=1&passive=1209600&service=wise&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-2094043582:1795562546970151 |
| 效率工具 | 飞书 | https://www.feishu.cn | 200 | 3040 | https://www.larksuite.com/en_sg/?from_site=feishu |
| 效率工具 | Slack | https://slack.com | 200 | 728 | https://slack.com/ |
| 学习资源 | 掘金 | https://juejin.cn | 200 | 1344 | https://juejin.cn/ |
| 学习资源 | B站 | https://www.bilibili.com | 200 | 1739 | https://www.bilibili.com/zh-Hans |
| 学习资源 | Dev.to | https://dev.to | 200 | 471 | https://dev.to/ |
| 学习资源 | Wikipedia | https://www.wikipedia.org | 200 | 705 | https://www.wikipedia.org/ |
| 学习资源 | Coursera | https://www.coursera.org | 200 | 724 | https://www.coursera.org/ |
| 学习资源 | 知乎 | https://www.zhihu.com | 200 | 1597 | https://www.zhihu.com/signin?next=%2F |
| 学习资源 | freeCodeCamp | https://www.freecodecamp.org | 200 | 738 | https://www.freecodecamp.org/ |
| 影音娱乐 | YouTube | https://www.youtube.com | 200 | 645 | https://www.youtube.com/ |
| 影音娱乐 | Netflix | https://www.netflix.com | 200 | 845 | https://www.netflix.com/ |
| 影音娱乐 | Spotify | https://www.spotify.com | 200 | 1353 | https://open.spotify.com/ |
| 影音娱乐 | Twitch | https://www.twitch.tv | 200 | 510 | https://www.twitch.tv/ |
| 影音娱乐 | 豆瓣 | https://www.douban.com | 200 | 1683 | https://www.douban.com/ |
| 影音娱乐 | Steam | https://store.steampowered.com | 200 | 1060 | https://store.steampowered.com/ |
| 影音娱乐 | 网易云音乐 | https://music.163.com | 200 | 1940 | https://music.163.com/ |
| 影音娱乐 | 抖音 | https://www.douyin.com | 200 | 810 | https://www.douyin.com/ |
| 影音娱乐 | 微博 | https://weibo.com | 200 | 2559 | https://passport.weibo.com/visitor/visitor?entry=miniblog&a=enter&url=https%3A%2F%2Fweibo.com%2F&domain=weibo.com&ua=Mozilla%2F5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F126.0%20Safari%2F537.36%20MoriGo-LinkCheck&_rand=1795562558297&sudaref= |
