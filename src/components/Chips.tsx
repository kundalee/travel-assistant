import type { CSSProperties } from 'react'

/* 篩選 chips，items: [key, label, count?] */
interface ChipsProps<K extends string> {
  items: [K, string, number?][]
  value: K
  onChange: (k: K) => void
  className?: string
  style?: CSSProperties
}

export function Chips<K extends string>({ items, value, onChange, className = 'chips', style }: ChipsProps<K>) {
  return (
    <div className={className} style={style}>
      {items.map(([k, label, n]) => (
        <button key={k} className={`chip ${value === k ? 'active' : ''}`} onClick={() => onChange(k)}>
          {label}{n ? ` (${n})` : ''}
        </button>
      ))}
    </div>
  )
}
