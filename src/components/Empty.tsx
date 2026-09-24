import { Icon, type IconName } from './Icon'

export function Empty({ text, icon = 'inbox', hint }: { text: string; icon?: IconName; hint?: string }) {
  return <div className="empty"><Icon name={icon} /><h4>{text}</h4>{hint && <p>{hint}</p>}</div>
}

/* 表格內的空狀態列 */
export function TableEmpty({ cols, icon, text }: { cols: number; icon: IconName; text: string }) {
  return <tr><td colSpan={cols}><div className="dt-empty"><Icon name={icon} />{text}</div></td></tr>
}
