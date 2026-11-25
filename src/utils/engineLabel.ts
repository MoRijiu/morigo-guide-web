import type { SearchEngine } from '../types'
import type { Locale } from '../i18n'

/**
 * 搜索引擎展示名：内置引擎名是 UI 文案（站内/百度/必应随语言走），
 * 自定义引擎用用户自己填的名字，原样展示。
 * t 函数由调用方传入，避免本工具反向依赖组件层。
 */
export function engineDisplayLabel(
  engine: SearchEngine,
  locale: Locale,
  t: (key: string) => string
): string {
  if (engine.key === 'site') return t('engine.site')
  if (locale !== 'zh' && engine.key === 'baidu') return 'Baidu'
  if (locale !== 'zh' && engine.key === 'bing') return 'Bing'
  return engine.label
}
