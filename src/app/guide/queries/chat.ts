import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../../../api/guide'
import { guideKeys } from './keys'

type ChatsData = Awaited<ReturnType<typeof chatApi.list>>

/** 行程對話（chats）與團購呼叫對話（dealChats） */
export const useChats = () => useQuery({ queryKey: guideKeys.chats, queryFn: () => chatApi.list() })

/** 傳送訊息：以後端回傳的訊息加入；首次對話（對話尚不存在）則重新讀取，取得後端建立的對話 */
export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { context: 'tour' | 'deal'; chatKey: string; text: string }) =>
      chatApi.send({ context: v.context, chatKey: v.chatKey }, { text: v.text }),
    onSuccess: (msg, { context, chatKey }) => {
      const field = context === 'deal' ? 'dealChats' : 'chats'
      const d = qc.getQueryData<ChatsData>(guideKeys.chats)
      if (!d?.[field][chatKey]) return qc.invalidateQueries({ queryKey: guideKeys.chats })
      qc.setQueryData<ChatsData>(guideKeys.chats, {
        ...d,
        [field]: { ...d[field], [chatKey]: { ...d[field][chatKey], msgs: [...d[field][chatKey].msgs, msg] } },
      })
    },
  })
}
