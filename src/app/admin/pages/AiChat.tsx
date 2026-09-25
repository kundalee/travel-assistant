import { useState } from 'react'
import { Icon, PageHead } from '../../../components'
import { aiApi } from '../../../api/admin'
import { errMsg } from '../utils'

interface Msg { role: 'u' | 'a'; text: string }

export default function AiChat() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'a', text: '您好，我是旅遊 AI 助理。可以詢問行程建議、商品排名分析或營運問題。' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  /* 由後端呼叫 AI 服務並回覆 */
  async function send() {
    const t = input.trim(); if (!t || busy) return
    setMsgs((m) => [...m, { role: 'u', text: t }])
    setInput('')
    setBusy(true)
    try {
      const { reply } = await aiApi.chat({ message: t })
      setMsgs((m) => [...m, { role: 'a', text: reply }])
    } catch (e) {
      setMsgs((m) => [...m, { role: 'a', text: '（無法取得回覆：' + errMsg(e) + '）' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pad">
      <PageHead icon="sparkles" title="AI 許願池" />
      <p className="hint" style={{ marginBottom: '0.8rem' }}>詢問營運分析、行程建議或商品排名。</p>
      {msgs.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}
      <div className="ai-input">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="輸入您的問題…" />
        <button className="btn btn-primary" onClick={send} disabled={busy} aria-busy={busy || undefined} aria-label="送出"><Icon name="send" /></button>
      </div>
    </div>
  )
}
