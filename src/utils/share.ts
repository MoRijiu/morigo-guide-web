import type { NavCategory } from '../types'
import { sanitizeCategories, sanitizeUrls } from './dataTransfer'

/**
 * 分享链接：把自定义分类与收藏编码进 URL 的 hash（#share=…），
 * 数据不经任何服务器，打开链接的一方在本地预览后自行决定是否导入。
 * 编码为 UTF-8 JSON → base64url。
 */
export interface SharePayload {
  customCategories: NavCategory[]
  favorites: string[]
}

const SHARE_PREFIX = '#share='

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

export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify({
    app: 'morigo-share',
    v: 1,
    cats: payload.customCategories,
    favs: payload.favorites,
  })
  return toBase64Url(new TextEncoder().encode(json))
}

/** 生成完整分享链接（基于当前地址，去掉已有 hash） */
export function buildShareUrl(payload: SharePayload): string {
  const base = window.location.href.split('#')[0]
  return `${base}${SHARE_PREFIX}${encodeShare(payload)}`
}

/** 解析分享编码；格式不对返回 null（静默，不打扰普通访问） */
export function decodeShare(encoded: string): SharePayload | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded))
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Record<string, unknown>
    if (p.app !== 'morigo-share') return null
    return {
      customCategories: sanitizeCategories(p.cats),
      favorites: sanitizeUrls(p.favs),
    }
  } catch {
    return null
  }
}

/** 从 location.hash 里取分享数据；没有或无效返回 null */
export function parseShareHash(hash: string): SharePayload | null {
  if (!hash.startsWith(SHARE_PREFIX)) return null
  const payload = decodeShare(hash.slice(SHARE_PREFIX.length))
  if (!payload) return null
  if (!payload.customCategories.length && !payload.favorites.length) return null
  return payload
}
