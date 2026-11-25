/**
 * 跨设备同步码：把全部本地用户数据（localStorage 中 `morigo:` 前缀的
 * 用户数据键）编码成一段可复制的文本，粘贴到另一台设备即可整表导入。
 * 数据不经任何服务器；与分享链接（R18，只含自定义站点+收藏）的区别是
 * 同步码覆盖全部偏好与记录，定位是「换设备搬家」而非「分享给别人」。
 * 格式：MORIGO-SYNC-1.<base64url(UTF-8 JSON)>.<fnv1a 校验和>
 * 可选口令加密（R54）：填了口令时改走加密格式
 * MORIGO-SYNC-E1.<base64url(salt16‖iv12‖AES-GCM 密文)>.<fnv1a 校验和>，
 * 密钥由口令经 PBKDF2-SHA256（21 万次迭代）派生，全程在浏览器本地用
 * WebCrypto 完成，口令本身不保存、数据仍不经任何服务器；忘了口令无法恢复。
 * 自定义背景图存 IndexedDB（二进制），不进同步码，界面文案已注明。
 */

/** 允许同步的 localStorage 键白名单（天气缓存等瞬时数据不进） */
export const SYNC_KEYS = [
  'morigo:custom',
  'morigo:favorites',
  'morigo:recent',
  'morigo:visit-counts',
  'morigo:last-visit',
  'morigo:custom-engines',
  'morigo:search-history',
  'morigo:active-engine',
  'morigo:view-prefs',
  'morigo:theme-prefs',
  'morigo:widgets',
  'morigo:locale',
] as const

const PREFIX = 'MORIGO-SYNC-1.'
const ENCRYPTED_PREFIX = 'MORIGO-SYNC-E1.'
const MAX_CODE_LENGTH = 2_000_000
const MAX_VALUE_LENGTH = 500_000
const PBKDF2_ITERATIONS = 210_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

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

/** 从 localStorage 收集白名单键生成明文 JSON；没有任何数据时返回空串 */
function buildSyncJson(): string {
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
  return JSON.stringify({
    app: 'morigo-sync',
    v: 1,
    exportedAt: new Date().toISOString(),
    store,
  })
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * 生成同步码；没有任何数据时返回空串。
 * passphrase 非空时生成加密码（MORIGO-SYNC-E1），导入端须输入相同口令。
 */
export async function buildSyncCode(passphrase = ''): Promise<string> {
  const json = buildSyncJson()
  if (!json) return ''
  const plain = new TextEncoder().encode(json)
  if (!passphrase) {
    const body = toBase64Url(plain)
    return `${PREFIX}${body}.${fnv1a(body)}`
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt)
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain),
  )
  const packed = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipher.length)
  packed.set(salt, 0)
  packed.set(iv, SALT_LENGTH)
  packed.set(cipher, SALT_LENGTH + IV_LENGTH)
  const body = toBase64Url(packed)
  return `${ENCRYPTED_PREFIX}${body}.${fnv1a(body)}`
}

/** 是否为加密同步码（只看前缀，不校验内容） */
export function isEncryptedSyncCode(code: string): boolean {
  return code.trim().startsWith(ENCRYPTED_PREFIX)
}

/**
 * 同步码外形校验（前缀 + 校验和），不解密、不解析内容。
 * WebDAV 拉回时先用它挡掉明显不是同步码的文件。
 */
export function looksLikeSyncCode(code: string): boolean {
  const trimmed = code.trim()
  if (trimmed.length > MAX_CODE_LENGTH) return false
  const prefix = trimmed.startsWith(ENCRYPTED_PREFIX)
    ? ENCRYPTED_PREFIX
    : trimmed.startsWith(PREFIX)
      ? PREFIX
      : null
  if (!prefix) return false
  const rest = trimmed.slice(prefix.length)
  const dot = rest.lastIndexOf('.')
  if (dot <= 0) return false
  return fnv1a(rest.slice(0, dot)) === rest.slice(dot + 1)
}

export interface SyncPayload {
  store: Record<string, string>
  exportedAt: string
}

export type SyncParseResult =
  | { status: 'ok'; payload: SyncPayload }
  | { status: 'invalid' }
  | { status: 'needs-passphrase' }
  | { status: 'wrong-passphrase' }

/** 校验外壳并拆出 body 字节；外形不合法返回 null */
function unpackBody(code: string, encrypted: boolean): Uint8Array | null {
  const trimmed = code.trim()
  const prefix = encrypted ? ENCRYPTED_PREFIX : PREFIX
  if (!trimmed.startsWith(prefix) || trimmed.length > MAX_CODE_LENGTH) return null
  const rest = trimmed.slice(prefix.length)
  const dot = rest.lastIndexOf('.')
  if (dot <= 0) return null
  const body = rest.slice(0, dot)
  if (fnv1a(body) !== rest.slice(dot + 1)) return null
  try {
    return fromBase64Url(body)
  } catch {
    return null
  }
}

function payloadFromBytes(bytes: Uint8Array): SyncPayload | null {
  try {
    const json = new TextDecoder().decode(bytes)
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

/**
 * 解析同步码：明码直接校验；加密码须传 passphrase 解密，
 * 缺口令返回 needs-passphrase、口令错误（GCM 校验失败）返回 wrong-passphrase。
 */
export async function parseSyncCode(
  code: string,
  passphrase = '',
): Promise<SyncParseResult> {
  const encrypted = isEncryptedSyncCode(code)
  const packed = unpackBody(code, encrypted)
  if (!packed) return { status: 'invalid' }
  if (!encrypted) {
    const payload = payloadFromBytes(packed)
    return payload ? { status: 'ok', payload } : { status: 'invalid' }
  }
  if (!passphrase) return { status: 'needs-passphrase' }
  if (packed.length <= SALT_LENGTH + IV_LENGTH) return { status: 'invalid' }
  const salt = packed.slice(0, SALT_LENGTH)
  const iv = packed.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const cipher = packed.slice(SALT_LENGTH + IV_LENGTH)
  try {
    const key = await deriveKey(passphrase, salt)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    const payload = payloadFromBytes(new Uint8Array(plain))
    return payload ? { status: 'ok', payload } : { status: 'invalid' }
  } catch {
    return { status: 'wrong-passphrase' }
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
