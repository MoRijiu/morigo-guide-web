/**
 * WebDAV 同步（R50 同步码的进阶版）：用户自备 WebDAV 服务
 * （Nextcloud / 坚果云 / 群晖等），把同步码文件 PUT / GET 到自己的
 * 服务器，免去手动复制粘贴。
 *
 * 安全口径：
 * - 配置（含密码）只存本机 localStorage 的 `morigo:webdav`，
 *   不进同步码白名单、不会被同步到其他设备；
 * - 数据只发往用户自己填的地址，不经任何第三方服务器；
 * - 浏览器直连 WebDAV 受目标服务 CORS 策略约束，服务端未放行时
 *   请求会失败，界面会给出提示。
 */
import { looksLikeSyncCode } from './syncCode'

export interface WebDavConfig {
  url: string
  username: string
  password: string
}

const STORAGE_KEY = 'morigo:webdav'
const FILE_NAME = 'morigo-sync.txt'

export function loadWebDavConfig(): WebDavConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { url: '', username: '', password: '' }
    const parsed = JSON.parse(raw) as Partial<WebDavConfig>
    return {
      url: typeof parsed.url === 'string' ? parsed.url : '',
      username: typeof parsed.username === 'string' ? parsed.username : '',
      password: typeof parsed.password === 'string' ? parsed.password : '',
    }
  } catch {
    return { url: '', username: '', password: '' }
  }
}

export function saveWebDavConfig(config: WebDavConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // 存储不可用时静默降级（本次会话内仍可使用）
  }
}

/** 配置是否完整可用：地址须为 http(s)、账号非空（密码允许为空，兼容无密码服务） */
export function isWebDavConfigValid(config: WebDavConfig): boolean {
  return /^https?:\/\/.+/i.test(config.url.trim()) && config.username.trim().length > 0
}

/** 目录地址自动拼文件名；已指向 .txt 文件则原样使用 */
export function resolveWebDavFileUrl(config: WebDavConfig): string {
  const base = config.url.trim().replace(/\/+$/, '')
  if (/\.txt$/i.test(base)) return base
  return `${base}/${FILE_NAME}`
}

function authHeader(config: WebDavConfig): string {
  const raw = `${config.username}:${config.password}`
  const bytes = new TextEncoder().encode(raw)
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return `Basic ${btoa(bin)}`
}

export class WebDavError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

/** 上传同步码到 WebDAV；失败抛 WebDavError（带 HTTP 状态码或网络错误标记） */
export async function uploadSyncCodeToWebDav(config: WebDavConfig, code: string): Promise<void> {
  let res: Response
  try {
    res = await fetch(resolveWebDavFileUrl(config), {
      method: 'PUT',
      headers: {
        Authorization: authHeader(config),
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: code,
    })
  } catch {
    throw new WebDavError('network')
  }
  if (!res.ok) throw new WebDavError('http', res.status)
}

/**
 * 从 WebDAV 拉回同步码原文；404 / 内容不合法分别抛错，外形校验通过返回原文。
 * 只做外形校验（前缀+校验和）：加密同步码（R54）在此步还没有口令，
 * 解密与内容校验由导入步完成。
 */
export async function downloadSyncCodeFromWebDav(config: WebDavConfig): Promise<string> {
  let res: Response
  try {
    res = await fetch(resolveWebDavFileUrl(config), {
      method: 'GET',
      headers: { Authorization: authHeader(config) },
    })
  } catch {
    throw new WebDavError('network')
  }
  if (res.status === 404) throw new WebDavError('notfound', 404)
  if (!res.ok) throw new WebDavError('http', res.status)
  const text = (await res.text()).trim()
  if (!looksLikeSyncCode(text)) throw new WebDavError('invalid')
  return text
}
