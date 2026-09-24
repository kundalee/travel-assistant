import type { Campaign, DealOrder, GuideData, PastMember, PastTour, RosterMember } from '../../api/types/guide'

const SURNAMES = ['林', '陳', '黃', '張', '李', '王', '吳', '蔡', '鄭', '許', '趙', '周', '劉', '楊', '洪', '謝']
const seatNo = (n: number) => String(n).padStart(3, '0')

/* 行程名冊：有種子資料者先列出，其餘以樣板補足到 count 人 */
export function rosterOf(data: GuideData, tourId: string, count?: number): RosterMember[] {
  const r = data.rosters[tourId]
  if (!r) {
    const pt = data.pastTours.find((t) => t.tourId === tourId)
    return pt ? genRoster(pt) : []
  }
  const code = (i: number) => `${r.tourTitle}_${r.batch}_${seatNo(i + 1)}`
  const out = r.members.map((m, i) => ({ ...m, code: code(i) }))
  for (let i = out.length; i < (count || out.length); i++) {
    out.push({ name: SURNAMES[i % SURNAMES.length] + '○○', email: `member${i + 1}@example.com`, nick: '團員' + (i + 1), code: code(i) })
  }
  return out
}

function genRoster(t: PastTour): RosterMember[] {
  return Array.from({ length: t.count }, (_, i) => ({
    name: SURNAMES[i % SURNAMES.length] + '○○', email: `m${t.tourId}_${i + 1}@example.com`, nick: '團員' + (i + 1),
    code: `${t.title}_${t.batch}_${seatNo(i + 1)}`,
  }))
}

/* 行程人數：歷史行程或目前行程 */
export function tourCount(data: GuideData, tourId: string) {
  return data.pastTours.find((t) => t.tourId === tourId)?.count
    ?? [...data.ongoing, ...data.upcoming].find((t) => t.tourId === tourId)?.members
    ?? 0
}

export function tourTitle(data: GuideData, tourId: string) {
  return data.pastTours.find((t) => t.tourId === tourId)?.title
    ?? [...data.ongoing, ...data.upcoming, ...data.completed].find((t) => t.tourId === tourId)?.title
    ?? ''
}

/* 我的歷史團員：彙整所有行程名冊 */
export function allPastMembers(data: GuideData): PastMember[] {
  return data.pastTours.flatMap((t) =>
    rosterOf(data, t.tourId, t.count).map((m) => ({ ...m, tourId: t.tourId, tourTitle: t.title, batch: t.batch })))
}

/* 團購呼叫對象：先前團員（排除進行中行程的團員） */
export function campaignMembers(data: GuideData) {
  const ongoing = data.ongoing.map((t) => t.tourId)
  return allPastMembers(data).filter((m) => !ongoing.includes(m.tourId))
}

export const memberOf = (data: GuideData, id: string) => data.members.find((m) => m.id === id)
export const pointName = (data: GuideData, id: string) => data.points.find((p) => p.id === id)?.name || '未指定'

/* 團購訂單累積的團員（以團編號去重） */
export function uniqueByCode(orders: DealOrder[]) {
  const seen = new Set<string>()
  return orders.filter((o) => !seen.has(o.code) && seen.add(o.code))
}

/* 呼叫訊息對應的選購團員：以訊息標題 / 內容比對精品好物名稱 */
export function campaignBuyers(data: GuideData, c: Campaign) {
  const matched = data.boutique.map((b) => b.name).filter((n) => c.title.includes(n) || c.body.includes(n))
  let orders = matched.length
    ? data.dealOrders.filter((o) => matched.some((n) => o.product.includes(n)))
    : data.dealOrders.filter((o) => c.title.includes(o.product))
  if (!orders.length) orders = data.dealOrders /* 無對應時顯示全部購買者（示範） */
  return uniqueByCode(orders)
}

export const avatarFor = (name: string, bg = 'E7F0FA', color = '1E4E8C') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}`
