import { ref, watch, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'

/**
 * 工具栏下拉面板的桌面定位（R56 在导入/导出面板首用，R57 抽为共用）：
 * 面板内容变高后向下展开可能超出视口底部——打开时实测按钮上下可用空间，
 * 下方不足时向上展开，并按可用空间动态限高；窗口缩放时重算。
 * 移动端（<640px）面板是 fixed 底部抽屉、走 CSS 既有口径，不参与此计算。
 */
export function usePanelLayout(rootEl: Ref<HTMLElement | null>, open: Ref<boolean>) {
  const panelUp = ref(false)
  const panelMaxH = ref<number | undefined>(undefined)

  function layoutPanel() {
    if (window.innerWidth < 640 || !rootEl.value) {
      panelUp.value = false
      panelMaxH.value = undefined
      return
    }
    const rect = rootEl.value.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - 12
    const above = rect.top - 12
    panelUp.value = below < 360 && above > below
    const space = panelUp.value ? above : below
    panelMaxH.value = Math.max(200, Math.min(Math.round(window.innerHeight * 0.85), space))
  }

  watch(open, (v) => {
    if (v) void nextTick(layoutPanel)
  })

  function onResize() {
    if (open.value) layoutPanel()
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onBeforeUnmount(() => window.removeEventListener('resize', onResize))

  return { panelUp, panelMaxH, layoutPanel }
}
