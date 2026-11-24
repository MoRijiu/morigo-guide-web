/**
 * 支持的 icon 格式：
 * - Iconify 字符串: "mdi:github"
 * - 远程图片 URL:  "https://example.com/icon.png"
 * - Base64:        "data:image/png;base64,..."
 * - 内联 SVG:      "<svg>...</svg>"
 * - 本地图片路径:   "/icons/foo.png"
 */
export type IconValue = string

export interface NavItem {
  title: string
  description: string
  url: string
  icon: IconValue
  /** 搜索别名：拼音、简称、中文译名等，命中同样算匹配（高亮只作用于标题/描述） */
  aliases?: string[]
  /** 热门推荐：无搜索结果时在空状态里推荐 */
  hot?: boolean
}

export interface NavCategory {
  name: string
  icon: IconValue
  items: NavItem[]
}

export interface SearchEngine {
  key: string
  label: string
  icon: IconValue
  url: string
}

export interface SiteConfig {
  title: string
  titleHighlight: string
  tagline: string
  logoIcon: IconValue
  domain: string
  domainUrl: string
  githubUrl: string

  search: {
    enabled: boolean
    engines: SearchEngine[]
  }

  mock: boolean

  navigation: NavCategory[]
}
