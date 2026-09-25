/* 以後端回應更新快取清單的小工具（不可變更新） */
type WithId = { id: string }

/** 已存在則取代，否則加入（預設加在最前面） */
export function upsertById<T extends WithId>(list: T[] | undefined, item: T, at: 'start' | 'end' = 'start'): T[] {
  if (!list) return [item]
  if (list.some((x) => x.id === item.id)) return list.map((x) => (x.id === item.id ? item : x))
  return at === 'start' ? [item, ...list] : [...list, item]
}

export const removeById = <T extends WithId>(list: T[] | undefined, id: string) => list?.filter((x) => x.id !== id)
