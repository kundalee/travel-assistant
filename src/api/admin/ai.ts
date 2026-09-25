import { post, resource } from '../resource'

export const aiApi = resource('admin.ai', '後台 · AI 許願池 AI', {
  chat: post<{ reply: string }, { message: string }>()('/admin/ai/chat', 'AI 許願池提問'),
})
