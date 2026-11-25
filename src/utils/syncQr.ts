/**
 * 同步码二维码（R61）：把生成的同步码渲染成二维码，另一台设备用相机
 * 扫码即可拿到全文、再粘贴进导入框，全程不经任何服务器。
 * 二维码字节模式在纠错级别 L 下的理论上限是 2953 字节（Version 40），
 * 这里留一点余量，超过上限直接返回 null，由界面提示改用复制文本或
 * WebDAV；纠错级别选 L 是为了在同样数据量下模块更少、更容易被扫到。
 */
export const SYNC_QR_MAX_BYTES = 2900

/** 同步码 → 二维码 PNG data URL；数据太长或编码失败返回 null */
export async function buildSyncQrDataUrl(code: string): Promise<string | null> {
  if (new TextEncoder().encode(code).length > SYNC_QR_MAX_BYTES) return null
  try {
    // qrcode 库只在生成二维码时才用到，动态 import 拆出主 bundle 按需加载；
    // 加载失败与编码失败走同一兜底（返回 null，界面提示改用文本/WebDAV）。
    const { default: QRCode } = await import('qrcode')
    return await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: 264,
    })
  } catch {
    return null
  }
}
