/* ═══════════════════════════════════════════════
   TanStack Query：伺服器資料的快取與寫入
   - 讀取：useQuery，依 queryKey 快取；切回視窗時若資料已過期會自動重新讀取
   - 寫入：useMutation，先呼叫 API，成功後以回應更新快取（與後端一致，不做樂觀更新）
   - 寫入失敗：統一在這裡顯示後端訊息
   ═══════════════════════════════════════════════ */
import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from '../components'
import { errMsg } from '../lib/utils'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: 0 },
  },
  mutationCache: new MutationCache({
    onError: (e) => toast(errMsg(e), 'alert-circle'),
  }),
})
