/**
 * 站点健康本地标记（纯本地、无网络探测）：
 * - stale：打开过，但距上次访问已超过 30 天
 * - never：已收藏但从未打开过
 * 默认未收藏且从未打开的站点不标记，避免满屏提示。
 */
export const STALE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type SiteHealth = 'stale' | 'never'

export function siteHealth(
  ctx: { lastVisitAt?: number; isFavorite: boolean; now?: number }
): SiteHealth | null {
  const now = ctx.now ?? Date.now()
  if (ctx.lastVisitAt && Number.isFinite(ctx.lastVisitAt)) {
    return now - ctx.lastVisitAt >= STALE_DAYS * DAY_MS ? 'stale' : null
  }
  return ctx.isFavorite ? 'never' : null
}

export function daysSince(ts: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - ts) / DAY_MS))
}
