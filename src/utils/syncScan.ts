/**
 * 同步码二维码扫描（R64）：R61 只能「出码」，本工具补「扫码」一半——
 * 在新设备上直接扫旧设备展示的同步码二维码，免去复制文本再粘贴。
 * 解码优先用浏览器原生 BarcodeDetector（零依赖、速度快，Chromium 系
 * 支持）；不可用时回退 jsQR（动态 import 懒加载，不进首屏 bundle，
 * 与 R63 的 qrcode 懒加载同口径）。相机画面只在本机逐帧解码，
 * 不上传任何服务器；相机不可用（非安全上下文/未授权/无设备）时
 * 界面提供「从图片识别」兜底（截图/照片同样走本地 jsQR 解码）。
 */

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options?: {
  formats?: string[]
}) => BarcodeDetectorLike

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
  return typeof w.BarcodeDetector === 'function' ? w.BarcodeDetector : null
}

/** 当前浏览器是否有原生 BarcodeDetector（UI 可据此提示，但回退路径始终可用） */
export function hasNativeBarcodeDetector(): boolean {
  return getBarcodeDetectorCtor() !== null
}

/** 用原生 BarcodeDetector 从视频/画布/位图源解码一帧；无码或不支持返回 null */
export async function detectWithNative(
  source: CanvasImageSource,
): Promise<string | null> {
  const Ctor = getBarcodeDetectorCtor()
  if (!Ctor) return null
  try {
    const detector = new Ctor({ formats: ['qr_code'] })
    const results = await detector.detect(source)
    for (const r of results) {
      if (r.rawValue) return r.rawValue
    }
  } catch {
    // 个别实现对某些源抛错，交给 jsQR 兜底
  }
  return null
}

/** 用 jsQR 从像素数据解码；无码返回 null。jsQR 懒加载，失败按无码处理 */
export async function decodeWithJsQr(data: ImageData): Promise<string | null> {
  try {
    const { default: jsQR } = await import('jsqr')
    const result = jsQR(data.data, data.width, data.height, {
      inversionAttempts: 'attemptBoth',
    })
    return result?.data ? result.data : null
  } catch {
    return null
  }
}

/** 从图片文件解码二维码（相机不可用时的兜底路径）；无码返回 null */
export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file)
    try {
      const native = await detectWithNative(bitmap)
      if (native) return native
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null
      ctx.drawImage(bitmap, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return await decodeWithJsQr(imageData)
    } finally {
      bitmap.close()
    }
  } catch {
    return null
  }
}
