<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  keyword?: string
}>()

interface Segment {
  text: string
  hit: boolean
}

const segments = computed<Segment[]>(() => {
  const k = (props.keyword ?? '').trim()
  if (!k) return [{ text: props.text, hit: false }]
  const lower = props.text.toLowerCase()
  const needle = k.toLowerCase()
  const out: Segment[] = []
  let i = 0
  while (i < props.text.length) {
    const idx = lower.indexOf(needle, i)
    if (idx === -1) {
      out.push({ text: props.text.slice(i), hit: false })
      break
    }
    if (idx > i) out.push({ text: props.text.slice(i, idx), hit: false })
    out.push({ text: props.text.slice(idx, idx + needle.length), hit: true })
    i = idx + needle.length
  }
  return out.length ? out : [{ text: props.text, hit: false }]
})
</script>

<template>
  <span><template v-for="(seg, i) in segments" :key="i"><mark v-if="seg.hit" class="bg-accent-100 dark:bg-accent-500/30 text-accent-700 dark:text-accent-200 rounded-[2px] px-px">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></span>
</template>
