import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/* children：放在說明下方的動作（例如「重新載入」按鈕） */
export function Empty({ text, icon = 'inbox', hint, children }: { text: string; icon?: IconName; hint?: string; children?: ReactNode }) {
  return <div className="empty"><Icon name={icon} /><h4>{text}</h4>{hint && <p>{hint}</p>}{children && <div className="empty-acts">{children}</div>}</div>
}

/* 表格內的空狀態列 */
export function TableEmpty({ cols, icon, text }: { cols: number; icon: IconName; text: string }) {
  return <tr><td colSpan={cols}><div className="dt-empty"><Icon name={icon} />{text}</div></td></tr>
}
