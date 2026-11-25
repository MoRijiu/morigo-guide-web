# 默认导航链接体检报告

- 生成时间：2026-11-25 08:41（本机时区）
- 工具：`scripts/check-links.mjs`（`npm run check:links`）
- 数据源：`src/config/navigation.ts` 默认数据（不含本地覆盖与用户自定义数据）
- 汇总：可达 69 · 存疑 9 · 失效 7 · 共 85

判定口径：可达 = 最终状态 2xx/3xx；存疑 = 401/403/429（多为站点对脚本或机房 IP 的拦截，人工用浏览器复核后再决定）；失效 = 其他 4xx、5xx、超时或网络错误。结果受运行环境的网络与地区影响，同一链接换个网络可能结论不同。

### 失效（7）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| AI 工具 | Gemini | https://gemini.google.com | UND_ERR_SOCKET | 10000 |  |
| AI 工具 | 通义千问 | https://tongyi.aliyun.com/qianwen | AbortError | 10000 |  |
| AI 工具 | Zucchini | https://www.Zucchini.com | UND_ERR_SOCKET | 10000 |  |
| AI 工具 | 文心一言 | https://yiyan.baidu.com | 404 | 3698 | https://wenxin.baidu.com/?enter_type=yiyan_site |
| 后端 & DevOps | Vercel | https://vercel.com | AbortError | 10000 |  |
| 云服务 | Microsoft Azure | https://azure.microsoft.com | AbortError | 10000 |  |
| 影音娱乐 | 小红书 | https://www.xiaohongshu.com | 404 | 1307 | https://www.xiaohongshu.com/ |

### 存疑（9）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | Stack Overflow | https://stackoverflow.com | 403 | 931 | https://stackoverflow.com/ |
| AI 工具 | DeepSeek | https://chat.deepseek.com | 403 | 835 | https://chat.deepseek.com/ |
| AI 工具 | Poe | https://poe.com | 403 | 796 | https://poe.com/ |
| AI 工具 | Midjourney | https://www.midjourney.com | 403 | 354 | https://www.midjourney.com/ |
| 设计资源 | Unsplash | https://unsplash.com | 401 | 1425 | https://unsplash.com/.within.website?redir=%2F |
| 设计资源 | Pexels | https://www.pexels.com | 403 | 519 | https://www.pexels.com/ |
| 效率工具 | Canva | https://www.canva.com | 403 | 532 | https://www.canva.com/ |
| 学习资源 | LeetCode | https://leetcode.cn | 403 | 788 | https://leetcode.cn/ |
| 影音娱乐 | 豆瓣 | https://www.douban.com | 403 | 1536 | https://www.douban.com/ |

### 可达（69）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | ChatGPT | https://chat.openai.com | 200 | 2017 | https://chatgpt.com/ |
| 常用工具 | Google | https://www.google.com | 200 | 964 | https://www.google.com/ |
| 常用工具 | GitHub | https://github.com | 200 | 967 | https://github.com/ |
| 常用工具 | 百度 | https://www.baidu.com | 200 | 2022 | https://www.baidu.com/ |
| AI 工具 | Claude | https://claude.ai | 200 | 1131 | https://claude.ai/login |
| AI 工具 | Perplexity | https://www.perplexity.ai | 200 | 688 | https://www.perplexity.ai/ |
| AI 工具 | Hugging Face | https://huggingface.co | 200 | 721 | https://huggingface.co/ |
| AI 工具 | Cursor | https://www.cursor.com | 200 | 1294 | https://cursor.com/ |
| AI 工具 | GitHub Copilot | https://github.com/features/copilot | 200 | 942 |  |
| 前端开发 | Vue.js | https://vuejs.org | 200 | 945 | https://vuejs.org/ |
| 前端开发 | React | https://react.dev | 200 | 796 | https://react.dev/ |
| 前端开发 | TailwindCSS | https://tailwindcss.com | 200 | 643 | https://tailwindcss.com/ |
| 前端开发 | TypeScript | https://www.typescriptlang.org | 200 | 554 | https://www.typescriptlang.org/ |
| 前端开发 | Vite | https://vitejs.dev | 200 | 1531 | https://vite.dev/ |
| 前端开发 | MDN Web Docs | https://developer.mozilla.org | 200 | 1318 | https://developer.mozilla.org/en-US/ |
| 前端开发 | Next.js | https://nextjs.org | 200 | 644 | https://nextjs.org/ |
| 前端开发 | Nuxt | https://nuxt.com | 200 | 589 | https://nuxt.com/ |
| 前端开发 | Angular | https://angular.dev | 200 | 494 | https://angular.dev/ |
| 前端开发 | Svelte | https://svelte.dev | 200 | 571 | https://svelte.dev/ |
| 设计资源 | Figma | https://www.figma.com | 200 | 1028 | https://www.figma.com/ |
| 设计资源 | Dribbble | https://dribbble.com | 202 | 718 | https://dribbble.com/ |
| 设计资源 | Iconify | https://iconify.design | 200 | 737 | https://iconify.design/ |
| 设计资源 | Behance | https://www.behance.net | 200 | 1153 | https://www.behance.net/ |
| 设计资源 | Framer | https://www.framer.com | 200 | 470 | https://www.framer.com/ |
| 后端 & DevOps | Docker Hub | https://hub.docker.com | 200 | 603 | https://hub.docker.com/ |
| 后端 & DevOps | Nginx | https://nginx.org | 200 | 1439 | https://nginx.org/ |
| 后端 & DevOps | Node.js | https://nodejs.org | 200 | 1400 | https://nodejs.org/en |
| 后端 & DevOps | Kubernetes | https://kubernetes.io | 200 | 463 | https://kubernetes.io/ |
| 后端 & DevOps | PostgreSQL | https://www.postgresql.org | 200 | 489 | https://www.postgresql.org/ |
| 后端 & DevOps | Redis | https://redis.io | 200 | 775 | https://redis.io/ |
| 后端 & DevOps | GitLab | https://gitlab.com | 200 | 1227 | https://about.gitlab.com/ |
| 后端 & DevOps | MongoDB | https://www.mongodb.com | 200 | 2968 | https://www.mongodb.com/ |
| 后端 & DevOps | Grafana | https://grafana.com | 200 | 542 | https://grafana.com/ |
| 云服务 | AWS | https://aws.amazon.com | 200 | 863 | https://aws.amazon.com/ |
| 云服务 | Google Cloud | https://cloud.google.com | 200 | 925 | https://cloud.google.com/ |
| 云服务 | 阿里云 | https://www.aliyun.com | 200 | 1001 | https://www.aliyun.com/ |
| 云服务 | Cloudflare | https://www.cloudflare.com | 200 | 924 | https://www.cloudflare.com/ |
| 云服务 | Supabase | https://supabase.com | 200 | 579 | https://supabase.com/ |
| 云服务 | 腾讯云 | https://cloud.tencent.com | 200 | 655 | https://cloud.tencent.com/ |
| 云服务 | DigitalOcean | https://www.digitalocean.com | 200 | 489 | https://www.digitalocean.com/ |
| 云服务 | 华为云 | https://www.huaweicloud.com | 200 | 1153 | https://www.huaweicloud.com/ |
| 效率工具 | Notion | https://www.notion.com | 200 | 573 | https://www.notion.com/ |
| 效率工具 | Obsidian | https://obsidian.md | 200 | 517 | https://obsidian.md/ |
| 效率工具 | DeepL | https://www.deepl.com | 200 | 1250 | https://www.deepl.com/en |
| 效率工具 | Todoist | https://todoist.com | 200 | 1416 | https://www.todoist.com/ |
| 效率工具 | Google Drive | https://drive.google.com | 200 | 2193 | https://accounts.google.com/v3/signin/identifier?continue=https://drive.google.com/&emr=1&followup=https://drive.google.com/&osid=1&passive=1209600&service=wise&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-2063440311:1795567249354837 |
| 效率工具 | 飞书 | https://www.feishu.cn | 200 | 3165 | https://www.larksuite.com/en_sg/?from_site=feishu |
| 效率工具 | Slack | https://slack.com | 200 | 602 | https://slack.com/ |
| 效率工具 | Trello | https://trello.com | 200 | 731 | https://trello.com/ |
| 效率工具 | 语雀 | https://www.yuque.com | 200 | 1814 | https://www.yuque.com/ |
| 学习资源 | 掘金 | https://juejin.cn | 200 | 1247 | https://juejin.cn/ |
| 学习资源 | B站 | https://www.bilibili.com | 200 | 2059 | https://www.bilibili.com/zh-Hans |
| 学习资源 | Dev.to | https://dev.to | 200 | 858 | https://dev.to/ |
| 学习资源 | Wikipedia | https://www.wikipedia.org | 200 | 686 | https://www.wikipedia.org/ |
| 学习资源 | Coursera | https://www.coursera.org | 200 | 1059 | https://www.coursera.org/ |
| 学习资源 | 知乎 | https://www.zhihu.com | 200 | 1983 | https://www.zhihu.com/signin?next=%2F |
| 学习资源 | freeCodeCamp | https://www.freecodecamp.org | 200 | 838 | https://www.freecodecamp.org/ |
| 学习资源 | arXiv | https://arxiv.org | 200 | 570 | https://arxiv.org/ |
| 学习资源 | Khan Academy | https://www.khanacademy.org | 200 | 881 | https://www.khanacademy.org/ |
| 影音娱乐 | YouTube | https://www.youtube.com | 200 | 686 | https://www.youtube.com/ |
| 影音娱乐 | Netflix | https://www.netflix.com | 200 | 804 | https://www.netflix.com/ |
| 影音娱乐 | Spotify | https://www.spotify.com | 200 | 1279 | https://open.spotify.com/ |
| 影音娱乐 | Twitch | https://www.twitch.tv | 200 | 366 | https://www.twitch.tv/ |
| 影音娱乐 | Steam | https://store.steampowered.com | 200 | 926 | https://store.steampowered.com/ |
| 影音娱乐 | 网易云音乐 | https://music.163.com | 200 | 1606 | https://music.163.com/ |
| 影音娱乐 | 抖音 | https://www.douyin.com | 200 | 718 | https://www.douyin.com/ |
| 影音娱乐 | 微博 | https://weibo.com | 200 | 2836 | https://passport.weibo.com/visitor/visitor?entry=miniblog&a=enter&url=https%3A%2F%2Fweibo.com%2F&domain=weibo.com&ua=Mozilla%2F5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F126.0%20Safari%2F537.36%20MoriGo-LinkCheck&_rand=1795567260968&sudaref= |
| 影音娱乐 | SoundCloud | https://soundcloud.com | 200 | 654 | https://soundcloud.com/ |
| 影音娱乐 | 爱奇艺 | https://www.iqiyi.com | 200 | 1274 | https://www.iqiyi.com/ |
