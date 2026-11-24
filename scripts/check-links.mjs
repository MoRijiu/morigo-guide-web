#!/usr/bin/env node
/**
 * MoriGo 默认导航数据链接体检（构建期/维护期工具，不进运行时）。
 *
 * 用法：
 *   node scripts/check-links.mjs            # 检查并生成 docs/LINK-CHECK.md，有失效链接也退出 0
 *   node scripts/check-links.mjs --strict   # 存在「失效」链接时退出 1（可挂 CI）
 *   node scripts/check-links.mjs --no-report # 只打印控制台，不写报告文件
 *
 * 说明：
 * - 数据源只有 src/config/navigation.ts 的默认数据（不含本地覆盖与用户自定义数据）。
 * - 判定分三档：可达（2xx/3xx 最终落点）、存疑（401/403/429，多为站点对脚本/机房 IP 的拦截，
 *   人工浏览器通常可开）、失效（其他 4xx、5xx、超时或网络错误）。
 * - 结果受运行环境的网络与地区影响：报告里请结合「存疑」档人工复核后再决定是否下架条目。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const strict = process.argv.includes('--strict')
const noReport = process.argv.includes('--no-report')
const TIMEOUT_MS = 10_000
const CONCURRENCY = 5
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 MoriGo-LinkCheck'

/** 从 navigation.ts 按源码顺序解析分类与条目（文件格式固定：分类 name+icon、条目 title+url）。 */
function parseNavigation(source) {
  const catRe = /\{\s*\n\s*name: '([^']+)',(?:[^\n]*\n){1,3}?\s*icon:/g
  const cats = []
  let m
  while ((m = catRe.exec(source)) !== null) {
    cats.push({ name: m[1], start: m.index })
  }
  const result = []
  cats.forEach((cat, i) => {
    const slice = source.slice(cat.start, i + 1 < cats.length ? cats[i + 1].start : undefined)
    const itemRe = /title: '([^']+)'[\s\S]*?url: '([^']+)'/g
    let im
    while ((im = itemRe.exec(slice)) !== null) {
      result.push({ category: cat.name, title: im[1], url: im[2] })
    }
  })
  return result
}

async function fetchStatus(url, method) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const started = Date.now()
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' },
    })
    // 只看状态，不消费 body；取消以尽快释放连接
    try {
      await res.body?.cancel()
    } catch {
      /* 忽略 */
    }
    return { status: res.status, finalUrl: res.url || url, ms: Date.now() - started }
  } finally {
    clearTimeout(timer)
  }
}

async function checkOne(item) {
  let last
  // 先 HEAD；部分站点不支持 HEAD（405/501）或直接断开，再用 GET 复核
  for (const method of ['HEAD', 'GET']) {
    try {
      last = await fetchStatus(item.url, method)
      if (method === 'HEAD' && (last.status === 405 || last.status === 501)) continue
      break
    } catch (err) {
      last = { status: 0, finalUrl: item.url, ms: TIMEOUT_MS, error: err?.cause?.code || err?.name || 'Error' }
      if (method === 'GET') break
    }
  }
  const { status } = last
  const level =
    status >= 200 && status < 400 ? 'ok' : status === 401 || status === 403 || status === 429 ? 'warn' : 'fail'
  return { ...item, ...last, level }
}

async function runPool(items, worker) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const idx = next++
        results[idx] = await worker(items[idx])
        const r = results[idx]
        const mark = r.level === 'ok' ? '✓' : r.level === 'warn' ? '?' : '✗'
        console.log(`${mark} [${r.category}] ${r.title} ${r.url} -> ${r.status || r.error} (${r.ms}ms)`)
      }
    }),
  )
  return results
}

const source = readFileSync(join(root, 'src/config/navigation.ts'), 'utf8')
const items = parseNavigation(source)
if (items.length === 0) {
  console.error('未能从 navigation.ts 解析出任何条目，请检查文件格式是否变化。')
  process.exit(2)
}
console.log(`开始体检：共 ${items.length} 个默认站点，并发 ${CONCURRENCY}，超时 ${TIMEOUT_MS}ms\n`)
const results = await runPool(items, checkOne)

const ok = results.filter((r) => r.level === 'ok')
const warn = results.filter((r) => r.level === 'warn')
const fail = results.filter((r) => r.level === 'fail')
console.log(`\n汇总：可达 ${ok.length} · 存疑 ${warn.length} · 失效 ${fail.length} · 共 ${results.length}`)

if (!noReport) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  const row = (r) =>
    `| ${r.category} | ${r.title} | ${r.url} | ${r.status || r.error || '-'} | ${r.ms} | ${r.finalUrl !== r.url ? r.finalUrl : ''} |`
  const section = (title, list) =>
    list.length
      ? `\n### ${title}（${list.length}）\n\n| 分类 | 站点 | URL | 状态 | 耗时 ms | 最终落点 |\n| --- | --- | --- | --- | --- | --- |\n${list.map(row).join('\n')}\n`
      : `\n### ${title}（0）\n\n无。\n`
  const md = `# 默认导航链接体检报告

- 生成时间：${stamp}（本机时区）
- 工具：\`scripts/check-links.mjs\`（\`npm run check:links\`）
- 数据源：\`src/config/navigation.ts\` 默认数据（不含本地覆盖与用户自定义数据）
- 汇总：可达 ${ok.length} · 存疑 ${warn.length} · 失效 ${fail.length} · 共 ${results.length}

判定口径：可达 = 最终状态 2xx/3xx；存疑 = 401/403/429（多为站点对脚本或机房 IP 的拦截，人工用浏览器复核后再决定）；失效 = 其他 4xx、5xx、超时或网络错误。结果受运行环境的网络与地区影响，同一链接换个网络可能结论不同。
${section('失效', fail)}${section('存疑', warn)}${section('可达', ok)}`
  writeFileSync(join(root, 'docs/LINK-CHECK.md'), md)
  console.log('报告已写入 docs/LINK-CHECK.md')
}

if (strict && fail.length > 0) {
  console.error(`--strict：存在 ${fail.length} 个失效链接，退出 1`)
  process.exit(1)
}
