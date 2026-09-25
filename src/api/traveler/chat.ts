import { get, post, resource } from '../resource'
import type { Chat, ChatMsg } from '../types/traveler'

export const chatApi = resource('traveler.chat', '團員 · 聊天 Chat', {
  list: get<Record<string, Chat>>()('/traveler/chats', '聊天室與訊息'),
  send: post<ChatMsg, { text: string }>()('/traveler/chats/:chatKey/messages', '傳送聊天訊息'),
})
