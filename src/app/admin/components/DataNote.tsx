import { isFake } from '../../../api/client'
import { Icon } from '../../../components'

/* 資料來源註記（展示資料 / 後端） */
/* group：此畫面資料所屬的 API 群組（預設整個後台） */
export function DataNote({ group = 'admin' }: { group?: string }) {
  const mock = isFake(group)
  return (
    <div className="dt-count">
      <Icon name={mock ? 'flask' : 'cloud'} />
      {mock ? '展示資料（尚未連接後端）' : '資料來源：後端資料庫'}
    </div>
  )
}
