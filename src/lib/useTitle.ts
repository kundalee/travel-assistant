import { useEffect } from 'react'

/* 設定瀏覽器分頁標題 */
export function useTitle(title: string) {
  useEffect(() => { document.title = title }, [title])
}
