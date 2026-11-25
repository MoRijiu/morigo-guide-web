/**
 * 拖拽边缘自动滚动：拖拽会话中指针靠近视口上/下边缘时自动滚动页面，
 * 否则长页面里屏幕外的分类既够不到（跨分类移动）、也排不了序——
 * 触屏拖拽时手柄 touch-none 还会禁掉原生滚动，此问题在移动端更明显。
 * 滚动速度随指针深入边缘的程度线性增加；每帧滚动后回调 onTick，
 * 由调用方用最后一次指针事件重算命中（页面滚了、指针没动，命中目标已变）。
 */
export interface DragAutoScroller {
  /** 每次指针移动时更新指针位置 */
  update: (x: number, y: number) => void
  /** 拖拽会话开始时启动 */
  start: () => void
  /** 拖拽会话结束时停止 */
  stop: () => void
}

const EDGE = 72
const MAX_SPEED = 16

export function createDragAutoScroller(onTick?: () => void): DragAutoScroller {
  let raf = 0
  let active = false
  let y = Number.POSITIVE_INFINITY

  function loop() {
    if (!active) return
    const h = window.innerHeight
    let dy = 0
    if (y < EDGE) dy = -Math.max(1, Math.ceil(((EDGE - y) / EDGE) * MAX_SPEED))
    else if (y > h - EDGE) dy = Math.max(1, Math.ceil(((y - (h - EDGE)) / EDGE) * MAX_SPEED))
    if (dy !== 0) {
      // 必须 instant：全站 html 有 scroll-behavior:smooth，默认 scrollBy 会被
      // 平滑动画吞掉大半（每帧调用互相打断），实测 1.5s 只滚约 200px
      window.scrollBy({ top: dy, behavior: 'instant' as ScrollBehavior })
      onTick?.()
    }
    raf = requestAnimationFrame(loop)
  }

  return {
    update(_x: number, nextY: number) {
      y = nextY
    },
    start() {
      if (active) return
      active = true
      raf = requestAnimationFrame(loop)
    },
    stop() {
      active = false
      cancelAnimationFrame(raf)
    },
  }
}
