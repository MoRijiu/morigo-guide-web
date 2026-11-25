/**
 * 复制文本到剪贴板，带兜底：
 * 1) navigator.clipboard.writeText（安全上下文 + 文档聚焦时可用）
 * 2) 失败时退回临时 textarea + document.execCommand('copy')
 * 两者都失败返回 false，调用方必须给用户可见反馈，不要静默吞错。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 落到下面的兜底路径
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
