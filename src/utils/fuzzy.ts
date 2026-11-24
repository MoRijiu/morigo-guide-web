/**
 * 轻量模糊匹配：子序列匹配 + 子串加权。
 * 返回分数（越大越靠前），不匹配返回 -1。纯本地计算，无依赖。
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0
  const idx = t.indexOf(q)
  if (idx >= 0) return 1000 - idx * 2 - t.length * 0.1
  // 子序列：q 的字符按序出现在 t 中，连续/靠前加分
  let score = 0
  let ti = 0
  let streak = 0
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]
    let found = -1
    for (let i = ti; i < t.length; i++) {
      if (t[i] === ch) { found = i; break }
    }
    if (found < 0) return -1
    streak = found === ti ? streak + 1 : 0
    score += 10 + streak * 5 - Math.min(found - ti, 8)
    ti = found + 1
  }
  return score
}

/** 对多个字段取最高分 */
export function fuzzyScoreFields(query: string, fields: (string | undefined)[]): number {
  let best = -1
  for (const f of fields) {
    if (!f) continue
    const s = fuzzyScore(query, f)
    if (s > best) best = s
  }
  return best
}
