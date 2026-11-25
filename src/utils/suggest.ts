import { fuzzyScore } from './fuzzy'
import type { NavItem } from '../types'

/**
 * 搜索建议的打分与补全（R41）：纯函数、无状态，便于单测与复用。
 * 站点打分 = 字段匹配分（标题 > 别名 > 域名 > 描述，含前缀加成与模糊子序列）
 *          + 个人热度（收藏、访问次数、热门标记）。
 */
export interface SuggestContext {
  favoriteUrls: ReadonlySet<string>
  visitCounts: Readonly<Record<string, number>>
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** 字段打分：子串命中走 fuzzyScore；标题/别名前缀命中额外加成 */
function fieldScore(query: string, text: string | undefined, weight: number, prefixBonus: number): number {
  if (!text) return -1
  const s = fuzzyScore(query, text)
  if (s < 0) return -1
  let score = s * weight
  if (text.toLowerCase().startsWith(query.toLowerCase())) score += prefixBonus
  return score
}

export function scoreSiteForQuery(query: string, item: NavItem, ctx: SuggestContext): number {
  const q = query.trim().toLowerCase()
  if (!q) return -1
  let best = -1
  best = Math.max(best, fieldScore(q, item.title, 1, 150))
  for (const a of item.aliases ?? []) best = Math.max(best, fieldScore(q, a, 0.9, 100))
  best = Math.max(best, fieldScore(q, hostOf(item.url), 0.6, 60))
  best = Math.max(best, fieldScore(q, item.description, 0.45, 0))
  best = Math.max(best, fieldScore(q, item.descriptionEn, 0.45, 0))
  best = Math.max(best, fieldScore(q, item.descriptionJa, 0.45, 0))
  if (best < 0) return -1
  // 个人热度加成：让常去的、收藏的站点在同等匹配下排前面
  if (ctx.favoriteUrls.has(item.url)) best += 120
  best += Math.min(ctx.visitCounts[item.url] ?? 0, 20) * 8
  if (item.hot) best += 40
  return best
}

/**
 * 补全词：从站点标题/别名与热门词里找「以查询开头（或某个词以查询开头）且更长」的候选，
 * 例如输 git → GitHub、输 shua → 刷题。按热门优先、短词优先排序，去重后取 limit 个。
 */
export function completionTerms(
  query: string,
  items: NavItem[],
  hotTerms: string[],
  limit: number,
  exclude: ReadonlySet<string>
): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const candidates = new Map<string, { text: string; hot: boolean }>()
  const consider = (text: string, hot: boolean) => {
    const lower = text.toLowerCase()
    if (lower.length <= q.length || exclude.has(lower) || candidates.has(lower)) return
    const wordHit = lower.split(/[\s·/-]+/).some((w) => w.startsWith(q))
    if (!lower.startsWith(q) && !wordHit) return
    candidates.set(lower, { text, hot })
  }
  for (const t of hotTerms) consider(t, true)
  for (const item of items) {
    consider(item.title, !!item.hot)
    for (const a of item.aliases ?? []) consider(a, !!item.hot)
  }
  return [...candidates.values()]
    .sort((a, b) => Number(b.hot) - Number(a.hot) || a.text.length - b.text.length)
    .slice(0, limit)
    .map((c) => c.text)
}
