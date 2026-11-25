import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

/**
 * 横向滚动条的可发现性口径（CategoryNav 分类条与 SearchBar 引擎行共用，R66 抽取）：
 * 原生滚动条隐藏后，溢出时按左右可滚状态给容器加 mask 渐隐提示仍可横滑；
 * PC 纵向滚轮在容器上转横滚（到边界不拦截，页面继续纵滚）。
 * 组件挂载时自动绑定 resize 与 wheel（passive:false，保证 preventDefault 生效），卸载时解绑。
 */
export function useHScroll() {
  const scrollRef = ref<HTMLElement | null>(null)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const hasOverflow = ref(false)

  function updateScrollState() {
    const el = scrollRef.value
    if (!el) {
      canScrollLeft.value = canScrollRight.value = hasOverflow.value = false
      return
    }
    canScrollLeft.value = el.scrollLeft > 4
    canScrollRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > 4
    hasOverflow.value = el.scrollWidth - el.clientWidth > 4
  }

  const maskImage = computed(() => {
    const l = canScrollLeft.value
    const r = canScrollRight.value
    if (l && r) return 'linear-gradient(to right, transparent, black 2.5rem, black calc(100% - 2.5rem), transparent)'
    if (l) return 'linear-gradient(to right, transparent, black 2.5rem)'
    if (r) return 'linear-gradient(to right, black calc(100% - 2.5rem), transparent)'
    return undefined
  })

  // 滚轮转横滚：悬停时纵向滚轮驱动横向滚动；已到边界则不拦截，页面继续纵滚
  function onWheel(e: WheelEvent) {
    const el = scrollRef.value
    if (!el || e.shiftKey) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    const max = el.scrollWidth - el.clientWidth
    if (max <= 0) return
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1
    const next = Math.max(0, Math.min(max, el.scrollLeft + e.deltaY * unit))
    if (next === el.scrollLeft) return
    e.preventDefault()
    el.scrollLeft = next
  }

  /** 内容/语言/尺寸变化后在下一帧重算可滚状态 */
  function refreshScrollState() {
    nextTick(updateScrollState)
  }

  onMounted(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    scrollRef.value?.addEventListener('wheel', onWheel, { passive: false })
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScrollState)
    scrollRef.value?.removeEventListener('wheel', onWheel)
  })

  return { scrollRef, canScrollLeft, canScrollRight, hasOverflow, maskImage, updateScrollState, onWheel, refreshScrollState }
}
