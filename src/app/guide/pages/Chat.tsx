import { useNavigate, useParams } from 'react-router-dom'
import { ChatView, SubHead } from '../components'
import { campaignMembers, uniqueByCode } from '../helpers'
import { useGuide } from '../store'
import type { GuideData } from '../../../api/types/guide'

/* 行程內對話：/guide/chat/:key（group1 = 全體；其餘為團員 id） */
export function TourChat() {
  const { key = 'group1' } = useParams()
  const { data, user, commit } = useGuide()
  const nav = useNavigate()
  const tabs: [string, string][] = [['group1', '全體'], ...data.members.map((m): [string, string] => [m.id, m.name])]
  const chat = data.chats[key]

  function send(text: string) {
    commit((d) => {
      d.chats[key]?.msgs.push({ self: true, name: '我 (領隊)', av: user!.profile.avatar, text, time: '剛剛' })
    }, { type: 'sendMessage', context: 'tour', chatKey: key, text })
  }

  return (
    <section className="screen active">
      <SubHead title={chat?.name || '團員對話'} back="/guide/tours" />
      <ChatView tabs={tabs} current={key} chat={chat} onSelect={(k) => nav(`/guide/chat/${k}`, { replace: true })}
        onSend={send} emptyHint="傳送訊息開始對話" />
    </section>
  )
}

/* 團購呼叫團員的名稱（團購訂單或歷史團員） */
function dealMemberName(data: GuideData, code: string) {
  return data.dealOrders.find((o) => o.code === code)?.member
    ?? campaignMembers(data).find((m) => m.code === code)?.name
    ?? code
}

/* 團購呼叫對話：/guide/deals/chat/:key（dealgroup / dg_<id> = 全體；其餘為團編號）
   與行程內呼叫分開記錄 */
export function DealChat() {
  const { key = 'dealgroup' } = useParams()
  const { data, user, commit } = useGuide()
  const nav = useNavigate()
  const groupKey = key.startsWith('dg_') ? key : 'dealgroup'
  const codes = uniqueByCode(data.dealOrders).map((o) => o.code)
  if (!key.startsWith('dg_') && key !== 'dealgroup' && !codes.includes(key)) codes.unshift(key)

  const tabs: [string, string][] = [[groupKey, '全體'], ...codes.map((c): [string, string] => [c, data.dealChats[c]?.name || dealMemberName(data, c)])]
  const title = data.dealChats[key]?.name || (key === 'dealgroup' ? '團購 · 全體團員' : dealMemberName(data, key))

  function send(text: string) {
    commit((d) => {
      d.dealChats[key] ??= key === 'dealgroup'
        ? { name: '團購 · 全體團員', group: true, msgs: [] }
        : { name: dealMemberName(d, key), group: false, msgs: [] }
      d.dealChats[key].msgs.push({ self: true, name: '我 (領隊)', av: user!.profile.avatar, text, time: '剛剛' })
    }, { type: 'sendMessage', context: 'deal', chatKey: key, text })
  }

  return (
    <section className="screen active">
      <SubHead title={title} back="/guide/deals" />
      <ChatView tabs={tabs} current={key} chat={data.dealChats[key]} onSelect={(k) => nav(`/guide/deals/chat/${encodeURIComponent(k)}`, { replace: true })}
        onSend={send} emptyHint="此為團購範圍的呼叫，與行程內呼叫分開記錄" />
    </section>
  )
}
