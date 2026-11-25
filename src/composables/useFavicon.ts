import { reactive } from 'vue'

/**
 * 站点 favicon 探测（纯本地、无第三方服务）：
 * 自定义站点未指定图标时，用 <img> 试探目标站点根目录的 /favicon.ico，
 * 加载成功才替换占位图标，失败/超时回退原图标。结果按 origin 缓存：
 * 成功长期有效，失败 7 天后重试（站点可能后来补上 favicon）。
 * 缓存是可重建的瞬时数据，不进同步码白名单。
 */

const CACHE_KEY = 'morigo:favicon-cache'
const FAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000
const PROBE_TIMEOUT_MS = 6000

type ProbeState = 'ok' | 'fail'

interface CacheEntry {
  s: ProbeState
  t: number
}

const states = reactive(new Map<string, ProbeState>())
const probing = new Set<string>()
let cacheLoaded = false

function originOf(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.origin
  } catch {
    return null
  }
}

function loadCache() {
  if (cacheLoaded) return
  cacheLoaded = true
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>
    const now = Date.now()
    for (const [origin, entry] of Object.entries(parsed)) {
      if (!entry || (entry.s !== 'ok' && entry.s !== 'fail')) continue
      if (entry.s === 'fail' && now - entry.t > FAIL_TTL_MS) continue
      states.set(origin, entry.s)
    }
  } catch {
    // 存储不可用/数据损坏时静默降级为内存缓存
  }
}

function saveCache() {
  try {
    const out: Record<string, CacheEntry> = {}
    const now = Date.now()
    for (const [origin, s] of states) out[origin] = { s, t: now }
    localStorage.setItem(CACHE_KEY, JSON.stringify(out))
  } catch {
    // 忽略写入失败
  }
}

export function useFavicon() {
  loadCache()

  /** 目标站点的 favicon 地址（无法解析时为 null） */
  function faviconUrl(url: string): string | null {
    const origin = originOf(url)
    return origin ? `${origin}/favicon.ico` : null
  }

  /** 已探测成功返回 favicon 地址；未探测/失败返回 null（调用方回退原图标） */
  function resolvedFavicon(url: string): string | null {
    const origin = originOf(url)
    if (!origin || states.get(origin) !== 'ok') return null
    return `${origin}/favicon.ico`
  }

  /** 触发一次探测（同 origin 并发去重，已有结论不重复） */
  function ensureFavicon(url: string) {
    const origin = originOf(url)
    if (!origin || states.has(origin) || probing.has(origin)) return
    probing.add(origin)
    const img = new Image()
    const timer = setTimeout(() => finish('fail'), PROBE_TIMEOUT_MS)
    const finish = (s: ProbeState) => {
      clearTimeout(timer)
      probing.delete(origin)
      states.set(origin, s)
      saveCache()
      img.onload = null
      img.onerror = null
    }
    img.onload = () => {
      // 部分站点对缺失 favicon 返回 200 的默认图/占位页，宽高为 0 时按失败处理
      finish(img.naturalWidth > 0 ? 'ok' : 'fail')
    }
    img.onerror = () => finish('fail')
    img.src = `${origin}/favicon.ico`
  }

  return { faviconUrl, resolvedFavicon, ensureFavicon }
}
