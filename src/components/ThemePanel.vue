<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useThemePrefs, ACCENTS, BACKGROUNDS } from '../composables/useThemePrefs'

const { accent, bg, glass, setAccent, setBg, setGlass } = useThemePrefs()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon icon="mdi:palette-outline" class="text-sm" />
      主题
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg p-3 text-left"
      role="group"
      aria-label="主题设置"
    >
      <p class="px-1 text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">强调色</p>
      <div class="flex items-center gap-2 px-1 mb-3" role="radiogroup" aria-label="强调色">
        <button
          v-for="a in ACCENTS"
          :key="a.id"
          type="button"
          role="radio"
          :aria-checked="accent === a.id"
          :aria-label="a.label"
          :title="a.label"
          class="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          :style="{ backgroundColor: a.swatch, boxShadow: accent === a.id ? `0 0 0 2px var(--tw-ring-offset-color, #fff), 0 0 0 4px ${a.swatch}` : undefined }"
          @click="setAccent(a.id)"
        >
          <Icon v-if="accent === a.id" icon="mdi:check" class="text-white text-sm" />
        </button>
      </div>

      <p class="px-1 text-[11px] font-medium text-surface-400 dark:text-surface-500 mb-1.5">背景</p>
      <div class="flex flex-wrap gap-1.5 px-1 mb-3" role="radiogroup" aria-label="背景预设">
        <button
          v-for="b in BACKGROUNDS"
          :key="b.id"
          type="button"
          role="radio"
          :aria-checked="bg === b.id"
          class="px-2 py-1 rounded-md text-[11px] border transition-colors"
          :class="bg === b.id
            ? 'border-accent-500 text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10'
            : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-accent-300'"
          @click="setBg(b.id)"
        >{{ b.label }}</button>
      </div>

      <button
        type="button"
        role="switch"
        :aria-checked="glass"
        class="w-full flex items-center justify-between px-1 py-1 rounded-md text-xs text-surface-600 dark:text-surface-300"
        @click="setGlass(!glass)"
      >
        <span>毛玻璃质感</span>
        <span
          class="relative w-8 h-[18px] rounded-full transition-colors"
          :class="glass ? 'bg-accent-500' : 'bg-surface-200 dark:bg-surface-700'"
          aria-hidden="true"
        >
          <span
            class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all"
            :style="{ left: glass ? '16px' : '2px' }"
          />
        </span>
      </button>
      <p class="px-1 mt-1.5 text-[11px] text-surface-300 dark:text-surface-600">主题偏好保存在本机浏览器。</p>
    </div>
  </div>
</template>
