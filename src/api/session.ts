/* sessionStorage 存取（私密模式等情況可能拋錯） */
export const session = {
  get<T>(key: string): T | null {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null') } catch { return null }
  },
  set(key: string, value: unknown) {
    try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  },
  remove(key: string) {
    try { sessionStorage.removeItem(key) } catch { /* ignore */ }
  },
}
