/**
 * 跨设备同步码：把全部本地用户数据（localStorage 中 `morigo:` 前缀的
 * 用户数据键）编码成一段可复制的文本，粘贴到另一台设备即可整表导入。
 * 数据不经任何服务器；与分享链接（R18，只含自定义站点+收藏）的区别是
 * 同步码覆盖全部偏好与记录，定位是「换设备搬家」而非「分享给别人」。
 * 格式：MORIGO-SYNC-1.<base64url(UTF-8 JSON)>.<fnv1a 校验和>
 * 自定义背景图存 IndexedDB（二进制），不进同步码，界面文案已注明。
 */

/** 允许同步的 localStorage 键白名单（天气缓存等瞬时数据不进） */
export const SYNC_KEYS = [
  'morigo:custom',
  'morigo:favorites',
  'morigo:recent',
  'morigo:visit-counts',
  'morigo:custom-engines',
  'morigo:search-history',
  'morigo:active-engine',
  'morigo:view-prefs',
  'morigo:theme-prefs',
  'morigo:widgets',
  'morigo:locale',
] as const

const PREFIX = 'MORIGO-SYNC-1.'
const MAX_CODE_LENGTH = 2_000_000
const MAX_VALUE_LENGTH = 500_000

function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** 从 localStorage 收集白名单键并生成同步码；没有任何数据时返回空串 */
export function buildSyncCode(): string {
  const store: Record<string, string> = {}
  for (const key of SYNC_KEYS) {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) store[key] = value
    } catch {
      // 存储不可用时跳过该键
    }
  }
  if (!Object.keys(store).length) return ''
  const json = JSON.stringify({
    app: 'morigo-sync',
    v: 1,
    exportedAt: new Date().toISOString(),
    store,
  })
  const body = toBase64Url(new TextEncoder().encode(json))
  return `${PREFIX}${body}.${fnv1a(body)}`
}

export interface SyncPayload {
  store: Record<string, string>
  exportedAt: string
}

/** 解析并校验同步码；任何不合法都返回 null */
export function parseSyncCode(code: string): SyncPayload | null {
  const trimmed = code.trim()
  if (!trimmed.startsWith(PREFIX) || trimmed.length > MAX_CODE_LENGTH) return null
  const rest = trimmed.slice(PREFIX.length)
  const dot = rest.lastIndexOf('.')
  if (dot <= 0) return null
  const body = rest.slice(0, dot)
  const checksum = rest.slice(dot + 1)
  if (fnv1a(body) !== checksum) return null
  try {
    const json = new TextDecoder().decode(fromBase64Url(body))
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Record<string, unknown>
    if (p.app !== 'morigo-sync' || !p.store || typeof p.store !== 'object') return null
    const rawStore = p.store as Record<string, unknown>
    const store: Record<string, string> = {}
    for (const key of SYNC_KEYS) {
      const value = rawStore[key]
      if (value === undefined) continue
      if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) return null
      // 不强制值是 JSON：locale/active-engine 等键存的是裸字符串；
      // 键已由白名单限定，各 composable 读取时自带结构校验，坏值会被静默降级
      store[key] = value
    }
    if (!Object.keys(store).length) return null
    return {
      store,
      exportedAt: typeof p.exportedAt === 'string' ? p.exportedAt : '',
    }
  } catch {
    return null
  }
}

/** 把同步码内容整表写入 localStorage（调用方负责确认与刷新页面） */
export function applySyncPayload(payload: SyncPayload): number {
  let count = 0
  for (const key of SYNC_KEYS) {
    try {
      if (key in payload.store) {
        localStorage.setItem(key, payload.store[key])
        count++
      } else {
        localStorage.removeItem(key)
      }
    } catch {
      // 单键写入失败不中断其余键
    }
  }
  return count
}
