import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chips, Icon } from '../../../components'
import { IMG } from '../../../api/mocks/traveler'
import { useTraveler } from '../store'
import type { ChatMsg } from '../../../api/types/traveler'

function Bubble({ m }: { m: ChatMsg }) {
  return (
    <div className={`msg ${m.self ? 'self' : 'other'} ${m.guide ? 'guide' : ''}`}>
      {m.av ? <img className="av" src={m.av} alt="" /> : <div className="av av-text">客</div>}
      <div className="bubble-wrap">
        <div className="sender">{m.name}</div>
        <div className="bubble">{m.text}</div>
        <div className="time">{m.time}</div>
      </div>
    </div>
  )
}

/* 聊天：/traveler/chat?c=group1 */
export default function Chat() {
  const { data, commit } = useTraveler()
  const [params, setParams] = useSearchParams()
  const keys = Object.keys(data.chats)
  const current = params.get('c') && data.chats[params.get('c')!] ? params.get('c')! : keys[0]
  const chat = data.chats[current]
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [current, chat?.msgs.length])

  function send() {
    const t = text.trim()
    if (!t) return
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    commit((d) => { d.chats[current].msgs.push({ self: true, name: '我', av: IMG.me, text: t, time }) }, { type: 'sendMessage', chatKey: current, text: t })
    setText('')
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }

  return (
    <section className="screen active">
      <Chips className="chips chat-tabs" value={current} onChange={(c) => setParams({ c }, { replace: true })} items={keys.map((k) => [k, data.chats[k].name])} />
      <div className="chat-shell">
        <div className="chat-scroll" ref={scrollRef}>
          <div className="sys-msg">您已加入「{chat.name}」聊天室</div>
          {chat.msgs.map((m, i) => <Bubble key={i} m={m} />)}
        </div>
        <div className="chat-input">
          <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder="輸入訊息…" />
          <button className="chat-send" onClick={send} aria-label="送出"><Icon name="send" /></button>
        </div>
      </div>
    </section>
  )
}
