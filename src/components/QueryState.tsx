import type { ReactNode } from 'react'
import { errMsg } from '../lib/utils'
import { Empty } from './Empty'
import { Icon } from './Icon'

/* 與 TanStack Query 的 useQuery 結果相容的最小介面 */
interface QueryLike {
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}

/**
 * 等待一個或多個查詢：任一載入中 → 顯示載入中；任一失敗 → 顯示錯誤與「重新載入」；全部完成才顯示內容。
 * children 為函式，確保只在資料就緒後才讀取 query.data。
 */
export function QueryState({ queries, children }: { queries: QueryLike[]; children: () => ReactNode }) {
  const failed = queries.filter((q) => q.isError)
  if (failed.length) {
    return (
      <Empty icon="cloud-off" text="資料讀取失敗" hint={errMsg(failed[0].error)}>
        <button className="btn btn-ghost btn-sm" onClick={() => failed.forEach((q) => q.refetch())}><Icon name="refresh" />重新載入</button>
      </Empty>
    )
  }
  if (queries.some((q) => q.isPending)) return <Empty icon="loader-2" text="載入中…" />
  return <>{children()}</>
}
