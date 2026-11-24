/**
 * 按标题哈希给卡片图标分配稳定的品牌底色。
 * 同一站点每次渲染颜色一致；类名写全字符串，保证 Tailwind 扫描得到。
 */
export interface IconTint {
  /** 图标容器底色（浅色/暗色） */
  bg: string
  /** 图标本体颜色（浅色/暗色） */
  text: string
}

const TINTS: IconTint[] = [
  { bg: 'bg-violet-100 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-sky-100 dark:bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  { bg: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
]

export function iconTint(seed: string): IconTint {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return TINTS[Math.abs(hash) % TINTS.length]
}
