import { Icon, QueryState } from '../../../components'
import { fmt } from '../../../lib/utils'
import { shippedTotals } from '../income'
import { useBoutique, useIncome, useNotices, useProfile } from '../queries'
import { GoodsGrid, NoticeGrid } from '../components'

export default function Home() {
  const profile = useProfile()
  const income = useIncome()
  const notices = useNotices()
  const boutique = useBoutique()
  const t = income.data ? shippedTotals([...income.data.souvenir, ...income.data.groupbuy]) : null

  return (
    <div className="page active">
      <div className="wrap">
        <div className="page-head">
          <div><h1>首頁 <span className="en">Home</span></h1><p>歡迎回來，{profile.data?.name || '支援店家'} 👋</p></div>
        </div>
        <QueryState queries={[income]}>{() => (
        <div className="stat-row">
          <div className="stat accent"><div className="label"><Icon name="coins" />本月收入</div><div className="value money">{fmt(t!.amount)}</div></div>
          <div className="stat green"><div className="label"><Icon name="trending-up" />本月利潤</div><div className="value money">{fmt(t!.profit)}</div></div>
          <div className="stat"><div className="label"><Icon name="package" />已出貨筆數</div><div className="value">{t!.count}</div></div>
        </div>
        )}</QueryState>
        <div className="section-title" style={{ marginTop: '0.5rem' }}><Icon name="speakerphone" />一般公告<span className="en">Announcements</span></div>
        <div style={{ marginBottom: '1.75rem' }}><QueryState queries={[notices]}>{() => <NoticeGrid notices={notices.data!} />}</QueryState></div>
        <div className="section-title"><Icon name="diamond" />精品好物<span className="en">Boutique Picks</span></div>
        <QueryState queries={[boutique]}>{() => <GoodsGrid goods={boutique.data!} />}</QueryState>
      </div>
    </div>
  )
}
