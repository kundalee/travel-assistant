import type { CSSProperties, ReactNode } from 'react'

/* 表單欄位：標籤（可選提示）+ 輸入元件 */
export function Field({ label, hint, children, style }: { label: ReactNode; hint?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="field" style={style}>
      <label>{label}{hint && <span className="lbl-hint"> — {hint}</span>}</label>
      {children}
    </div>
  )
}
