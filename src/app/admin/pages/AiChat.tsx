import { useState } from 'react'
import { Icon, PageHead } from '../../../components'
import { STATS } from '../../../api/mocks/admin'

interface Msg { role: 'u' | 'a'; text: string }

export default function AiChat() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'a', text: '您好，我是旅遊 AI 助理。可以詢問行程建議、商品排名分析或營運問題。' }])
  const [input, setInput] = useState('')

  /* 示範回覆；實際由後端呼叫 AI API */
  function send() {
    const t = input.trim(); if (!t) return
    const top = STATS.rankSouvenir[0]
    setMsgs([...msgs, { role: 'u', text: t }, {
      role: 'a',
      text: `（示範回覆）依目前資料，最熱銷紀念商品為「${top.n}」（${top.v} 件）。可於「統計分析報表 → 商品分析」查看完整排名。`,
    }])
    setInput('')
  }

  return (
    <div className="pad">
      <PageHead icon="sparkles" title="AI 許願池" />
      <p className="hint" style={{ marginBottom: '0.8rem' }}>詢問營運分析、行程建議或商品排名。</p>
      {msgs.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}
      <div className="ai-input">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="輸入您的問題…" />
        <button className="btn btn-primary" onClick={send} aria-label="送出"><Icon name="send" /></button>
      </div>
    </div>
  )
}
