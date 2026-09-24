/* 各入口共用的小工具 */

export const fmt = (n: unknown) => (Number(n) || 0).toLocaleString('en-US')
export const clone = <T,>(x: T): T => structuredClone(x)
export const uid = (prefix: string) => prefix + Date.now()
export const includesQ = (parts: (string | number | undefined | null)[], q: string) =>
  !q || parts.filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase())

export const errMsg = (e: unknown) => (e instanceof Error && e.message) || '發生錯誤，請稍後再試。'

/* 解析單欄座標「緯度, 經度」（容許空白、括號） */
export function parseCoord(raw: string) {
  const m = (raw || '').replace(/[()]/g, '').trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null
}
