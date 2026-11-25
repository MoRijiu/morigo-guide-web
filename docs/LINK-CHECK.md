# 默认导航链接体检报告

- 生成时间：2026-11-25 08:51（本机时区）
- 工具：`scripts/check-links.mjs`（`npm run check:links`）
- 数据源：`src/config/navigation.ts` 默认数据（不含本地覆盖与用户自定义数据）
- 汇总：可达 89 · 存疑 13 · 失效 7 · 共 109

判定口径：可达 = 最终状态 2xx/3xx；存疑 = 401/403/429（多为站点对脚本或机房 IP 的拦截，人工用浏览器复核后再决定）；失效 = 其他 4xx、5xx、超时或网络错误。结果受运行环境的网络与地区影响，同一链接换个网络可能结论不同。

### 失效（7）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| AI 工具 | Gemini | https://gemini.google.com | UND_ERR_SOCKET | 10000 |  |
| AI 工具 | 通义千问 | https://tongyi.aliyun.com/qianwen | AbortError | 10000 |  |
| AI 工具 | Zucchini | https://www.Zucchini.com | UND_ERR_SOCKET | 10000 |  |
| AI 工具 | 文心一言 | https://yiyan.baidu.com | 404 | 3351 | https://wenxin.baidu.com/?enter_type=yiyan_site |
| 云服务 | Microsoft Azure | https://azure.microsoft.com | AbortError | 10000 |  |
| 影音娱乐 | 小红书 | https://www.xiaohongshu.com | 404 | 1230 | https://www.xiaohongshu.com/ |
| 旅行出行 | 高德地图 | https://ditu.amap.com | AbortError | 10000 |  |

### 存疑（13）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | Stack Overflow | https://stackoverflow.com | 403 | 724 | https://stackoverflow.com/ |
| AI 工具 | DeepSeek | https://chat.deepseek.com | 403 | 704 | https://chat.deepseek.com/ |
| AI 工具 | Poe | https://poe.com | 403 | 703 | https://poe.com/ |
| AI 工具 | Midjourney | https://www.midjourney.com | 403 | 409 | https://www.midjourney.com/ |
| 设计资源 | Unsplash | https://unsplash.com | 401 | 1483 | https://unsplash.com/.within.website?redir=%2F |
| 设计资源 | Pexels | https://www.pexels.com | 403 | 560 | https://www.pexels.com/ |
| 效率工具 | Canva | https://www.canva.com | 403 | 575 | https://www.canva.com/ |
| 学习资源 | LeetCode | https://leetcode.cn | 403 | 572 | https://leetcode.cn/ |
| 游戏 | Epic Games | https://store.epicgames.com | 403 | 730 | https://store.epicgames.com/ |
| 购物 | Etsy | https://www.etsy.com | 403 | 802 | https://www.etsy.com/ |
| 旅行出行 | Google Maps | https://maps.google.com | 403 | 8108 | https://maps.google.com/ |
| 旅行出行 | Expedia | https://www.expedia.com | 429 | 698 | https://www.expedia.com/ |
| 旅行出行 | Tripadvisor | https://www.tripadvisor.com | 403 | 1145 | https://www.tripadvisor.com/ |

### 可达（89）

| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |
| --- | --- | --- | --- | --- | --- |
| 常用工具 | ChatGPT | https://chat.openai.com | 200 | 1788 | https://chatgpt.com/ |
| 常用工具 | Google | https://www.google.com | 200 | 853 | https://www.google.com/ |
| 常用工具 | GitHub | https://github.com | 200 | 1197 | https://github.com/ |
| 常用工具 | 百度 | https://www.baidu.com | 200 | 1949 | https://www.baidu.com/ |
| AI 工具 | Claude | https://claude.ai | 200 | 1084 | https://claude.ai/login |
| AI 工具 | Perplexity | https://www.perplexity.ai | 200 | 773 | https://www.perplexity.ai/ |
| AI 工具 | Hugging Face | https://huggingface.co | 200 | 920 | https://huggingface.co/ |
| AI 工具 | Cursor | https://www.cursor.com | 200 | 1579 | https://cursor.com/ |
| AI 工具 | GitHub Copilot | https://github.com/features/copilot | 200 | 1085 |  |
| 前端开发 | Vue.js | https://vuejs.org | 200 | 528 | https://vuejs.org/ |
| 前端开发 | React | https://react.dev | 200 | 567 | https://react.dev/ |
| 前端开发 | TailwindCSS | https://tailwindcss.com | 200 | 493 | https://tailwindcss.com/ |
| 前端开发 | TypeScript | https://www.typescriptlang.org | 200 | 469 | https://www.typescriptlang.org/ |
| 前端开发 | Vite | https://vitejs.dev | 200 | 1207 | https://vite.dev/ |
| 前端开发 | MDN Web Docs | https://developer.mozilla.org | 200 | 922 | https://developer.mozilla.org/en-US/ |
| 前端开发 | Next.js | https://nextjs.org | 200 | 619 | https://nextjs.org/ |
| 前端开发 | Nuxt | https://nuxt.com | 200 | 650 | https://nuxt.com/ |
| 前端开发 | Angular | https://angular.dev | 200 | 422 | https://angular.dev/ |
| 前端开发 | Svelte | https://svelte.dev | 200 | 539 | https://svelte.dev/ |
| 设计资源 | Figma | https://www.figma.com | 200 | 1038 | https://www.figma.com/ |
| 设计资源 | Dribbble | https://dribbble.com | 202 | 826 | https://dribbble.com/ |
| 设计资源 | Iconify | https://iconify.design | 200 | 776 | https://iconify.design/ |
| 设计资源 | Behance | https://www.behance.net | 200 | 1331 | https://www.behance.net/ |
| 设计资源 | Framer | https://www.framer.com | 200 | 616 | https://www.framer.com/ |
| 后端 & DevOps | Docker Hub | https://hub.docker.com | 200 | 541 | https://hub.docker.com/ |
| 后端 & DevOps | Nginx | https://nginx.org | 200 | 1484 | https://nginx.org/ |
| 后端 & DevOps | Node.js | https://nodejs.org | 200 | 1581 | https://nodejs.org/en |
| 后端 & DevOps | Vercel | https://vercel.com | 200 | 541 | https://vercel.com/ |
| 后端 & DevOps | Kubernetes | https://kubernetes.io | 200 | 425 | https://kubernetes.io/ |
| 后端 & DevOps | PostgreSQL | https://www.postgresql.org | 200 | 616 | https://www.postgresql.org/ |
| 后端 & DevOps | Redis | https://redis.io | 200 | 661 | https://redis.io/ |
| 后端 & DevOps | GitLab | https://gitlab.com | 200 | 1252 | https://about.gitlab.com/ |
| 后端 & DevOps | MongoDB | https://www.mongodb.com | 200 | 2503 | https://www.mongodb.com/ |
| 后端 & DevOps | Grafana | https://grafana.com | 200 | 596 | https://grafana.com/ |
| 云服务 | AWS | https://aws.amazon.com | 200 | 978 | https://aws.amazon.com/ |
| 云服务 | Google Cloud | https://cloud.google.com | 200 | 1155 | https://cloud.google.com/ |
| 云服务 | 阿里云 | https://www.aliyun.com | 200 | 819 | https://www.aliyun.com/ |
| 云服务 | Cloudflare | https://www.cloudflare.com | 200 | 728 | https://www.cloudflare.com/ |
| 云服务 | Supabase | https://supabase.com | 200 | 469 | https://supabase.com/ |
| 云服务 | 腾讯云 | https://cloud.tencent.com | 200 | 1341 | https://cloud.tencent.com/ |
| 云服务 | DigitalOcean | https://www.digitalocean.com | 200 | 952 | https://www.digitalocean.com/ |
| 云服务 | 华为云 | https://www.huaweicloud.com | 200 | 1025 | https://www.huaweicloud.com/ |
| 效率工具 | Notion | https://www.notion.com | 200 | 617 | https://www.notion.com/ |
| 效率工具 | Obsidian | https://obsidian.md | 200 | 461 | https://obsidian.md/ |
| 效率工具 | DeepL | https://www.deepl.com | 200 | 1523 | https://www.deepl.com/en |
| 效率工具 | Todoist | https://todoist.com | 200 | 1715 | https://www.todoist.com/ |
| 效率工具 | Google Drive | https://drive.google.com | 200 | 2585 | https://accounts.google.com/v3/signin/identifier?continue=https://drive.google.com/&emr=1&followup=https://drive.google.com/&osid=1&passive=1209600&service=wise&flowName=GlifWebSignIn&flowEntry=ServiceLogin&dsh=S-234485296:1795567880747868 |
| 效率工具 | 飞书 | https://www.feishu.cn | 200 | 3084 | https://www.larksuite.com/en_sg/?from_site=feishu |
| 效率工具 | Slack | https://slack.com | 200 | 518 | https://slack.com/ |
| 效率工具 | Trello | https://trello.com | 200 | 1103 | https://trello.com/ |
| 效率工具 | 语雀 | https://www.yuque.com | 200 | 1355 | https://www.yuque.com/ |
| 学习资源 | 掘金 | https://juejin.cn | 200 | 1358 | https://juejin.cn/ |
| 学习资源 | B站 | https://www.bilibili.com | 200 | 2336 | https://www.bilibili.com/zh-Hans |
| 学习资源 | Dev.to | https://dev.to | 200 | 702 | https://dev.to/ |
| 学习资源 | Wikipedia | https://www.wikipedia.org | 200 | 680 | https://www.wikipedia.org/ |
| 学习资源 | Coursera | https://www.coursera.org | 200 | 1115 | https://www.coursera.org/ |
| 学习资源 | 知乎 | https://www.zhihu.com | 200 | 1959 | https://www.zhihu.com/signin?next=%2F |
| 学习资源 | freeCodeCamp | https://www.freecodecamp.org | 200 | 884 | https://www.freecodecamp.org/ |
| 学习资源 | arXiv | https://arxiv.org | 200 | 704 | https://arxiv.org/ |
| 学习资源 | Khan Academy | https://www.khanacademy.org | 200 | 900 | https://www.khanacademy.org/ |
| 影音娱乐 | YouTube | https://www.youtube.com | 200 | 1068 | https://www.youtube.com/ |
| 影音娱乐 | Netflix | https://www.netflix.com | 200 | 843 | https://www.netflix.com/ |
| 影音娱乐 | Spotify | https://www.spotify.com | 200 | 1703 | https://open.spotify.com/ |
| 影音娱乐 | Twitch | https://www.twitch.tv | 200 | 557 | https://www.twitch.tv/ |
| 影音娱乐 | 豆瓣 | https://www.douban.com | 200 | 2671 | https://www.douban.com/ |
| 影音娱乐 | Steam | https://store.steampowered.com | 200 | 1226 | https://store.steampowered.com/ |
| 影音娱乐 | 网易云音乐 | https://music.163.com | 200 | 1809 | https://music.163.com/ |
| 影音娱乐 | 抖音 | https://www.douyin.com | 200 | 1248 | https://www.douyin.com/ |
| 影音娱乐 | 微博 | https://weibo.com | 200 | 2956 | https://passport.weibo.com/visitor/visitor?entry=miniblog&a=enter&url=https%3A%2F%2Fweibo.com%2F&domain=weibo.com&ua=Mozilla%2F5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F126.0%20Safari%2F537.36%20MoriGo-LinkCheck&_rand=1795567891332&sudaref= |
| 影音娱乐 | SoundCloud | https://soundcloud.com | 200 | 697 | https://soundcloud.com/ |
| 影音娱乐 | 爱奇艺 | https://www.iqiyi.com | 200 | 1528 | https://www.iqiyi.com/ |
| 游戏 | GOG | https://www.gog.com | 200 | 2037 | https://www.gog.com/en/ |
| 游戏 | itch.io | https://itch.io | 200 | 769 | https://itch.io/ |
| 游戏 | Xbox | https://www.xbox.com | 200 | 2118 | https://www.xbox.com/en-US/ |
| 游戏 | PlayStation | https://www.playstation.com | 200 | 2145 | https://www.playstation.com/en-us/ |
| 游戏 | Nintendo | https://www.nintendo.com | 200 | 1025 | https://www.nintendo.com/us/ |
| 游戏 | Riot Games | https://www.riotgames.com | 200 | 2353 | https://www.riotgames.com/en |
| 游戏 | 米哈游 | https://www.mihoyo.com | 200 | 620 | https://www.mihoyo.com/ |
| 购物 | Amazon | https://www.amazon.com | 200 | 560 | https://www.amazon.com/ |
| 购物 | 淘宝 | https://www.taobao.com | 200 | 895 | https://www.taobao.com/ |
| 购物 | 京东 | https://www.jd.com | 200 | 1890 | https://corporate.jd.com/home |
| 购物 | eBay | https://www.ebay.com | 200 | 1189 | https://www.ebay.com/ |
| 购物 | AliExpress | https://www.aliexpress.com | 200 | 2208 | https://www.aliexpress.us/?gatewayAdapt=glo2usa&_randl_shipto=US |
| 购物 | Shopee | https://shopee.com | 200 | 695 | https://shopee.com/ |
| 购物 | 拼多多 | https://www.pinduoduo.com | 200 | 1115 | https://www.pinduoduo.com/ |
| 旅行出行 | Booking.com | https://www.booking.com | 200 | 1338 | https://www.booking.com/ |
| 旅行出行 | Airbnb | https://www.airbnb.com | 200 | 1064 | https://www.airbnb.com/ |
| 旅行出行 | Trip.com | https://www.trip.com | 200 | 3321 | https://us.trip.com/?locale=en-us |
| 旅行出行 | Uber | https://www.uber.com | 200 | 931 | https://www.uber.com/ |
