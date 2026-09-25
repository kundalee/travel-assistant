import { useNavigate, useParams } from 'react-router-dom'
import { QueryState } from '../../../components'
import { ChatView, SubHead } from '../components'
import { campaignMembers, uniqueByCode } from '../helpers'
import { useChats, useDealOrders, useMembers, useSendMessage, useTours } from '../queries'
import type { DealOrder, GuideData } from '../../../api/types/guide'

/* 送出成功才清空輸入（ChatView 依回傳值決定）；失敗訊息由 queryClient 統一顯示 */
function useSend(context: 'tour' | 'deal', chatKey: string) {
  const send = useSendMessage()
  return (text: string) => send.mutateAsync({ context, chatKey, text }).then(() => true, () => false)
}

/* 行程內對話：/guide/chat/:key（group1 = 全體；其餘為團員 id） */
export function TourChat() {
  const { key = 'group1' } = useParams()
  const members = useMembers()
  const chats = useChats()
  const nav = useNavigate()
  const send = useSend('tour', key)
  const chat = chats.data?.chats[key]

  return (
    <section className="screen active">
      <SubHead title={chat?.name || '團員對話'} back="/guide/tours" />
      <QueryState queries={[members, chats]}>{() => (
        <ChatView tabs={[['group1', '全體'], ...members.data!.members.map((m): [string, string] => [m.id, m.name])]}
          current={key} chat={chat} onSelect={(k) => nav(`/guide/chat/${k}`, { replace: true })}
          onSend={send} emptyHint="傳送訊息開始對話" />
      )}</QueryState>
    </section>
  )
}

/* 團購呼叫團員的名稱（團購訂單或歷史團員） */
function dealMemberName(data: Pick<GuideData, 'rosters' | 'pastTours' | 'ongoing'> & { dealOrders: DealOrder[] }, code: string) {
  return data.dealOrders.find((o) => o.code === code)?.member
    ?? campaignMembers(data).find((m) => m.code === code)?.name
    ?? code
}

/* 團購呼叫對話：/guide/deals/chat/:key（dealgroup / dg_<id> = 全體；其餘為團編號）
   與行程內呼叫分開記錄 */
export function DealChat() {
  const { key = 'dealgroup' } = useParams()
  const chats = useChats()
  const dealOrders = useDealOrders()
  const members = useMembers()
  const tours = useTours()
  const nav = useNavigate()
  const send = useSend('deal', key)

  return (
    <QueryState queries={[chats, dealOrders, members, tours]}>{() => {
      const data = { ...members.data!, ...tours.data!, dealOrders: dealOrders.data! }
      const dealChats = chats.data!.dealChats
      const groupKey = key.startsWith('dg_') ? key : 'dealgroup'
      const codes = uniqueByCode(data.dealOrders).map((o) => o.code)
      if (!key.startsWith('dg_') && key !== 'dealgroup' && !codes.includes(key)) codes.unshift(key)
      const tabs: [string, string][] = [[groupKey, '全體'], ...codes.map((c): [string, string] => [c, dealChats[c]?.name || dealMemberName(data, c)])]
      const title = dealChats[key]?.name || (key === 'dealgroup' ? '團購 · 全體團員' : dealMemberName(data, key))
      return (
        <section className="screen active">
          <SubHead title={title} back="/guide/deals" />
          <ChatView tabs={tabs} current={key} chat={dealChats[key]} onSelect={(k) => nav(`/guide/deals/chat/${encodeURIComponent(k)}`, { replace: true })}
            onSend={send} emptyHint="此為團購範圍的呼叫，與行程內呼叫分開記錄" />
        </section>
      )
    }}</QueryState>
  )
}
