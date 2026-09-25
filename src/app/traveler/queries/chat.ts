import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../../../api/traveler'
import type { Chat } from '../../../api/types/traveler'
import { travelerKeys } from './keys'

export const useChats = () => useQuery({ queryKey: travelerKeys.chats, queryFn: () => chatApi.list() })

/** 傳送訊息：以後端回傳的訊息（時間、頭像）加入 */
export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { chatKey: string; text: string }) => chatApi.send({ chatKey: v.chatKey }, { text: v.text }),
    onSuccess: (msg, { chatKey }) => qc.setQueryData<Record<string, Chat>>(travelerKeys.chats, (d) => d?.[chatKey]
      ? { ...d, [chatKey]: { ...d[chatKey], msgs: [...d[chatKey].msgs, msg] } }
      : d),
  })
}
