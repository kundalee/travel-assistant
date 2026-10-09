import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

/* 頁面標題列：圖示 + 標題（可選返回鍵），右側一組操作按鈕（多個按鈕排在一起） */
export function PageHead({ icon, title, back, children }: { icon: IconName; title: ReactNode; back?: string; children?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="page-head">
      <div className="ph-title">
        {back && <button className="back" onClick={() => nav(back)} aria-label="返回"><Icon name="arrow-left" /></button>}
        <Icon name={icon} className="tt" />{title}
      </div>
      {children && <div className="ph-acts">{children}</div>}
    </div>
  )
}
