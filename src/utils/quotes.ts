/**
 * 本地一言库：纯本地语录，不请求任何外部 API（离线可用、国内可达）。
 * 中/英/日各一组，按日期取「每日一句」，用户也可手动换一句（随机）。
 */
export interface Quote {
  text: string
  author: string
}

export const QUOTES: Record<'zh' | 'en' | 'ja', Quote[]> = {
  zh: [
    { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原《离骚》' },
    { text: '山重水复疑无路，柳暗花明又一村。', author: '陆游' },
    { text: '不积跬步，无以至千里。', author: '《荀子·劝学》' },
    { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
    { text: '海内存知己，天涯若比邻。', author: '王勃' },
    { text: '欲穷千里目，更上一层楼。', author: '王之涣' },
    { text: '人生若只如初见，何事秋风悲画扇。', author: '纳兰性德' },
    { text: '天行健，君子以自强不息。', author: '《周易》' },
    { text: '博观而约取，厚积而薄发。', author: '苏轼' },
    { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
    { text: '莫听穿林打叶声，何妨吟啸且徐行。', author: '苏轼' },
    { text: '千里之行，始于足下。', author: '《老子》' },
    { text: '山有木兮木有枝，心悦君兮君不知。', author: '《越人歌》' },
    { text: '行到水穷处，坐看云起时。', author: '王维' },
  ],
  en: [
    { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
    { text: 'Stay hungry, stay foolish.', author: 'Stewart Brand' },
    { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
    { text: 'What we achieve inwardly will change outer reality.', author: 'Plutarch' },
    { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
    { text: 'Whether you think you can or you think you can’t, you’re right.', author: 'Henry Ford' },
    { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
    { text: 'Well begun is half done.', author: 'Aristotle' },
    { text: 'Knowledge is power.', author: 'Francis Bacon' },
    { text: 'Time is a game played beautifully by children.', author: 'Heraclitus' },
    { text: 'Less, but better.', author: 'Dieter Rams' },
    { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Curiosity is the engine of achievement.', author: 'Ken Robinson' },
  ],
  ja: [
    { text: '為せば成る、為さねば成らぬ何事も。', author: '上杉鷹山' },
    { text: '七転び八起き。', author: 'ことわざ' },
    { text: '継続は力なり。', author: '格言' },
    { text: '千里の道も一歩から。', author: '老子' },
    { text: '人間万事塞翁が馬。', author: 'ことわざ' },
    { text: '明日は明日の風が吹く。', author: 'ことわざ' },
    { text: '石の上にも三年。', author: 'ことわざ' },
    { text: '急がば回れ。', author: 'ことわざ' },
    { text: '思い立ったが吉日。', author: 'ことわざ' },
    { text: '笑う門には福来たる。', author: 'ことわざ' },
    { text: '一期一会。', author: '千利休' },
    { text: '温故知新。', author: '孔子' },
    { text: '初心忘るべからず。', author: '世阿弥' },
    { text: '夢なき者に成功なし。', author: '吉田松陰' },
  ],
}

/** 按本地日期取当日索引（同一天内稳定） */
export function dailyQuoteIndex(date: Date, total: number): number {
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate()
  return total > 0 ? seed % total : 0
}
