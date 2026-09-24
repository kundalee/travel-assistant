import { useAdmin } from '../store'
import { Icon } from '../../../components'

/* 資料來源註記（展示資料 / 後端） */
export function DataNote() {
  const { mock } = useAdmin()
  return (
    <div className="dt-count">
      <Icon name={mock ? 'flask' : 'cloud'} />
      {mock ? '展示資料（尚未連接後端）' : '資料來源：後端資料庫'}
    </div>
  )
}
