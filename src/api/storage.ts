/* localStorage 存取（私密模式等情況可能拋錯）；同一瀏覽器的所有分頁共用 */
export const storage = {
  get<T>(key: string): T | null {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  },
  remove(key: string) {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
  },
}
