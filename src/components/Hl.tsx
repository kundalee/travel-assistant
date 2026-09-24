/* 搜尋字詞高亮 */
export function Hl({ text, q }: { text?: string | number | null; q?: string }) {
  const s = text == null ? '' : String(text)
  if (!q || !s) return <>{s}</>
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig')
  return <>{s.split(re).map((part, i) => (i % 2 ? <mark key={i} className="hl">{part}</mark> : part))}</>
}
