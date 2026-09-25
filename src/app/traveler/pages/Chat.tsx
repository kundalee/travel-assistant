import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chips, Icon, QueryState } from '../../../components'
import { useChats, useSendMessage } from '../queries'
import type { Chat as ChatRoom, ChatMsg } from '../../../api/types/traveler'

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
  const chats = useChats()
  return (
    <section className="screen active">
      <QueryState queries={[chats]}>{() => <ChatRooms chats={chats.data!} />}</QueryState>
    </section>
  )
}

function ChatRooms({ chats }: { chats: Record<string, ChatRoom> }) {
  const sendMessage = useSendMessage()
  const [params, setParams] = useSearchParams()
  const keys = Object.keys(chats)
  const current = params.get('c') && chats[params.get('c')!] ? params.get('c')! : keys[0]
  const chat = chats[current]
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [current, chat?.msgs.length])

  /* 送出成功才加入後端回傳的訊息並清空輸入；失敗時保留文字 */
  async function send() {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    const ok = await sendMessage.mutateAsync({ chatKey: current, text: t }).then(() => true, () => false)
    setSending(false)
    if (ok) setText('')
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }

  return (
    <>
      <Chips className="chips chat-tabs" value={current} onChange={(c) => setParams({ c }, { replace: true })} items={keys.map((k) => [k, chats[k].name])} />
      <div className="chat-shell">
        <div className="chat-scroll" ref={scrollRef}>
          <div className="sys-msg">您已加入「{chat.name}」聊天室</div>
          {chat.msgs.map((m, i) => <Bubble key={i} m={m} />)}
        </div>
        <div className="chat-input">
          <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder="輸入訊息…" />
          <button className="chat-send" onClick={send} disabled={sending} aria-busy={sending || undefined} aria-label="送出"><Icon name="send" /></button>
        </div>
      </div>
    </>
  )
}
