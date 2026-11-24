import type { NavCategory, SiteConfig } from '../types'
import { mockNavigation } from './navigation'

// 个人清单（可选）：src/config/navigation.local.ts 已 gitignore，不进仓库。
// 存在时其分类合并置顶；不存在时只用通用默认数据（他人 fork 不受影响）。
// 用法见同目录 navigation.local.example.ts。
const localModules = import.meta.glob<{ localNavigation?: NavCategory[]; default?: NavCategory[] }>(
  './navigation.local.ts',
  { eager: true },
)
const localNavigation: NavCategory[] =
  Object.values(localModules).flatMap((m) => m.localNavigation ?? m.default ?? [])

const siteConfig: SiteConfig = {
  // ==================== 品牌 ====================
  title: 'Mori',
  titleHighlight: 'Go',
  tagline: '去发现，去抵达',
  logoIcon: 'mdi:arrow-top-right-bold-box',

  // ==================== 链接 ====================
  domain: 'go.morijiu.cn',
  domainUrl: 'https://go.morijiu.cn',
  githubUrl: 'https://github.com/MoRijiu/morigo-guide-web',

  // ==================== 搜索 ====================
  search: {
    enabled: true,
    engines: [
      { key: 'site', label: '站内', icon: 'mdi:compass-outline', url: '' },
      { key: 'baidu', label: '百度', icon: 'simple-icons:baidu', url: 'https://www.baidu.com/s?wd=' },
      { key: 'bing', label: '必应', icon: 'simple-icons:microsoftbing', url: 'https://www.bing.com/search?q=' },
      { key: 'google', label: 'Google', icon: 'mdi:google', url: 'https://www.google.com/search?q=' },
    ],
  },

  // ==================== 数据 ====================
  // mock: true  → 使用下方 mockNavigation 内置数据
  // mock: false → 后续可对接 API，目前仍回退到内置数据
  mock: true,

  // ==================== 导航数据 ====================
  navigation: [...localNavigation, ...mockNavigation],
}

export default siteConfig
