import type { ReactNode } from 'react'
import { ostatusClass, STATUS_ALL, type OrderStatus } from '../lib/orders'
import { fmt } from '../lib/utils'
import { Chips } from './Chips'
import { Empty } from './Empty'
import { Icon } from './Icon'

/* 訂單：狀態篩選 chips + 依狀態分區加總；render 渲染每一列 */
export function StatusGroups<T extends { status: OrderStatus; amount: number }>({
  rows, filter, onFilter, render, people,
}: {
  rows: T[]
  filter: OrderStatus | '全部'
  onFilter: (s: OrderStatus | '全部') => void
  render: (row: T) => ReactNode
  /** 計算人數（顯示「N 位」） */
  people?: (rows: T[]) => number
}) {
  const shown = rows.filter((o) => filter === '全部' || o.status === filter)
  const overall = shown.filter((o) => o.status !== '已取消').reduce((a, o) => a + o.amount, 0)
  const sections = (filter === '全部' ? STATUS_ALL : [filter]).map((st) => {
    const group = rows.filter((o) => o.status === st)
    if (!group.length) return null
    const sum = group.reduce((a, o) => a + o.amount, 0)
    return (
      <div className="buy-group" key={st}>
        <div className="buy-group-head">
          <span className={`ostatus ${ostatusClass(st)}`}>{st}</span>
          <span className="buy-sub">{people ? `${people(group)} 位 · ` : ''}{group.length} 筆 · 總額 <b>NT$ {fmt(sum)}</b></span>
        </div>
        {group.map(render)}
      </div>
    )
  }).filter(Boolean)

  return (
    <>
      <Chips<OrderStatus | '全部'>
        style={{ marginBottom: '0.8rem' }} value={filter} onChange={onFilter}
        items={(['全部', ...STATUS_ALL] as (OrderStatus | '全部')[]).map((s) => [s, s, s === '全部' ? rows.length : rows.filter((o) => o.status === s).length])}
      />
      <div className="data-note"><Icon name="receipt" />合計 {shown.length} 筆 · NT$ {fmt(overall)}（不含已取消）</div>
      {sections.length ? sections : <Empty icon="receipt-off" text="查無符合訂單" />}
    </>
  )
}

