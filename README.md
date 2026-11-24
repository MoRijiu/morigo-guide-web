# MoriGo 导航站

> 去发现，去抵达 · Discover. Arrive.

一个简洁、现代、**开源可自部署**的网址导航站 / 起始页，基于 Vue 3 + TypeScript + Vite + TailwindCSS 构建。纯静态、无后端、零追踪——所有偏好与个人数据只存在你自己的浏览器里。

MoriGo is an open-source, self-hostable navigation / start page. Static only, no backend, no tracking — every preference and your personal data stay in your own browser.

🔗 **在线预览 / Live demo**：[go.morijiu.cn](https://go.morijiu.cn)

---

## ✨ 特性 Features

- **精选默认数据** — 9 大分类、51 个站点（常用工具 / AI 工具 / 前端开发 / 设计资源 / 后端 & DevOps / 云服务 / 效率工具 / 学习资源 / 影音娱乐），全部带搜索别名（拼音、简称、中文译名）
- **快搜索** — 关键词高亮、别名/中英双语匹配、无结果时外部引擎直达 + 热门推荐；搜索建议下拉（历史 + 热门 + 站点直达）、搜索历史、自定义搜索引擎（`{q}` 模板）
- **命令面板** — `Ctrl/⌘ + K` 全局呼出，模糊搜索站点 + 动作命令（切换主题、加站点、导出、统计、分享……），全键盘操作
- **收藏与最近访问** — 星标收藏置顶分组、最近访问自动记录、一键复制链接
- **自定义站点** — 页面里直接增删改自己的站点与分类（localStorage 持久化），与默认数据合并展示
- **拖拽排序** — 「我的收藏」与自定义分类可拖拽排序（指针拖拽 + `Alt+↑/↓` 键盘），顺序持久化
- **导入 / 导出 / 分享** — 备份 JSON 导出导入（合并/覆盖）、导入浏览器书签 HTML、把清单编码进链接分享给别人（数据不经服务器）
- **视图与布局** — 网格/列表视图、舒适/紧凑密度、分类折叠/展开，偏好持久化
- **主题系统** — 6 套强调色、5 种渐变背景预设 + **自定义本地图片背景**（压缩存 IndexedDB、淡化强度可调）、毛玻璃质感、深色模式
- **小组件区** — 可开关的组件带：时钟/日期、每日一言（本地语录库）、倒计时（可编辑目标）
- **本地统计** — 访问次数 Top、分类占比小面板，纯本地计算、绝不上报
- **中英双语** — 顶栏一键切换；UI 文案与默认导航数据（分类名/站点描述）均双语，首次访问按浏览器语言自动选择
- **PWA** — 可安装到桌面/主屏幕，Service Worker 离线缓存，断网照常浏览
- **键盘流与无障碍** — `/` 聚焦搜索、方向键选卡、Esc 分层清空；skip link、aria 标签、focus 可见轮廓
- **零运行时外网依赖** — 图标与字体全部本地打包，部署后不依赖任何第三方 CDN

## 🛠 技术栈 Tech Stack

| 技术 | 说明 |
|---|---|
| [Vue 3](https://vuejs.org) | 渐进式前端框架（Composition API + `<script setup>`） |
| [TypeScript](https://www.typescriptlang.org) | 类型安全 |
| [Vite](https://vitejs.dev) | 开发与构建 |
| [TailwindCSS](https://tailwindcss.com) | 原子化 CSS |
| [Iconify](https://iconify.design) | 图标方案（构建期本地注册，无运行时请求） |
| @fontsource | Inter / Space Grotesk 字体自托管 |

## 📁 项目结构

```
src/
├── App.vue                # 主布局与全局状态编排
├── components/            # 组件：顶栏 / 搜索 / 分类 / 卡片 / 命令面板 /
│                          #   主题 / 统计 / 小组件 / 导入导出 / 站点表单 等
├── composables/           # 本地状态：收藏与统计、自定义站点、视图/主题偏好、
│                          #   搜索引擎与历史、PWA、自定义背景、小组件
├── config/
│   ├── site.ts            # 站点配置（品牌、链接、搜索引擎、数据装配）
│   ├── navigation.ts      # 默认导航数据（双语字段 nameEn / descriptionEn）
│   └── navigation.local.example.ts  # 个人清单示例（见下）
├── i18n/                  # 中/英双语文案字典与语言状态
├── icons/                 # 本地注册的图标集（scripts/gen-icons.mjs 生成）
├── utils/                 # 模糊匹配、数据导入导出、分享链接、链接 slug 等
└── types/                 # TypeScript 类型
docs/                      # 需求文档 REQUIREMENTS.md、设计规范 DESIGN.md、链接体检报告
scripts/                   # gen-icons.mjs（图标生成）、check-links.mjs（链接体检）
public/                    # manifest、Service Worker、图标、robots.txt
```

## 🚀 快速开始 Quick Start

```bash
git clone https://github.com/MoRijiu/morigo-guide-web.git
cd morigo-guide-web

npm install        # 安装依赖
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本（vue-tsc 类型检查 + vite build）
npm run preview    # 预览生产构建
npm run check:links  # 链接体检：检查默认数据全部链接可达性，报告写 docs/LINK-CHECK.md
```

构建产物在 `dist/`，丢到任何静态托管（Nginx / 七牛 / Vercel / GitHub Pages…）即可上线。

## 🧩 放你自己的站点清单 Your Own List

仓库默认数据只包含通用示例分类，不包含任何维护者的私人站点。想把你自己的产品/站点置顶展示，不用改默认数据：

1. 复制 `src/config/navigation.local.example.ts` 为 `src/config/navigation.local.ts`（该文件已加入 `.gitignore`，不会被提交）。
2. 把里面的示例分类换成你自己的站点清单（可带 `nameEn` / `descriptionEn` 英文字段，缺省回退中文）。
3. 重新构建：本地清单存在时会自动合并并置顶；不存在时只展示默认数据。

这样你 fork / 自部署时首页是你的清单，仓库本身保持干净通用。访客侧的临时清单则用页面内的「添加站点」功能（存浏览器本地），或用导入/导出、分享链接在设备间搬运。

## ⚙️ 配置说明 Configuration

编辑 `src/config/site.ts` 即可自定义全站：品牌名（`title` / `titleHighlight`）、Logo 图标、域名与 GitHub 链接、搜索引擎列表、导航数据装配都在这里。界面副标题等文案走 `src/i18n` 双语字典（顶栏语言按钮切换）。

### 图标格式

所有 `icon` 字段支持多种格式：

| 格式 | 示例 |
|---|---|
| Iconify | `"mdi:github"` |
| 远程 URL | `"https://example.com/icon.png"` |
| Base64 | `"data:image/png;base64,..."` |
| 内联 SVG | `"<svg>...</svg>"` |
| 本地图片 | `"/icons/logo.png"` |

> 注意：运行时实际渲染走构建期本地注册的图标集（`src/icons/localIcons.ts`，由 `scripts/gen-icons.mjs` 按源码用到的图标名生成）；新增图标名后跑一次生成脚本，或改用图片 URL 格式。

## 🚢 部署 Deployment

纯静态站，`npm run build` 后把 `dist/` 发布到任意静态托管即可。版本徽标取 `package.json` 的 `version`（构建注入）：构建时设 `VITE_APP_ENV=test` 显示 `_test` 后缀、生产不设后缀、开发 `_dev`，口径见 `docs/REQUIREMENTS.md`。

更细的产品口径与迭代记录见 [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md)，视觉规范见 [docs/DESIGN.md](./docs/DESIGN.md)。

## 📄 License

[MIT](./LICENSE)
