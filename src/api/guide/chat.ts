import { get, post, resource } from '../resource'
import type { Chat, ChatMsg } from '../types/guide'

export const chatApi = resource('guide.chat', '領隊 · 對話 Chat', {
  list: get<{ chats: Record<string, Chat>; dealChats: Record<string, Chat> }>()('/guide/chats', '行程對話與團購呼叫對話'),
  /** context：tour = 行程對話、deal = 團購呼叫對話 */
  send: post<ChatMsg, { text: string }>()('/guide/chats/:context/:chatKey/messages', '傳送訊息（context = tour / deal）'),
})
