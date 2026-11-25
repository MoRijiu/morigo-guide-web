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
  /** 英文描述（可选）：英文模式下展示，缺省回退 description。站点名多为品牌名，不设标题翻译 */
  descriptionEn?: string
  /** 日语描述（可选）：日语模式下展示，缺省回退 descriptionEn 再回退 description */
  descriptionJa?: string
  url: string
  icon: IconValue
  /** 优先使用站点自身 favicon（可选）：无品牌图标、只能用通用图标兜底的条目开启，
   *  运行时探测 /favicon.ico 成功才替换兜底图标，失败仍显示 icon */
  favicon?: boolean
  /** 搜索别名：拼音、简称、中文译名等，命中同样算匹配（高亮只作用于标题/描述） */
  aliases?: string[]
  /** 热门推荐：无搜索结果时在空状态里推荐 */
  hot?: boolean
}

export interface NavCategory {
  name: string
  /** 英文分类名（可选）：英文模式下展示，缺省回退 name。name 始终是身份标识（合并/折叠/锚点都按它），不随语言变 */
  nameEn?: string
  /** 日语分类名（可选）：日语模式下展示，缺省回退 nameEn 再回退 name */
  nameJa?: string
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
