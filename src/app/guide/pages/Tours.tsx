import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Empty, FlightModal, Modal, NotesModal, VideoModal } from '../../../components'
import { PageTitle, ReviewCard, Screen, TourCard } from '../components'
import { useGuide } from '../store'
import type { CompletedTour, UpcomingTour } from '../../../api/types/guide'

type TourTab = 'ongoing' | 'completed' | 'upcoming'
const TAB_LABEL: Record<TourTab, string> = { ongoing: '進行中', completed: '已完成', upcoming: '即將出發' }

export type UpcomingView =
  | { kind: 'video'; tour: UpcomingTour }
  | { kind: 'notes'; tour: UpcomingTour }
  | { kind: 'flight'; tour: UpcomingTour }
  | { kind: 'reviews'; tour: CompletedTour }

/* 即將出發：說明影片 / 相關說明 / 航班資訊；已完成：審視評價 */
export function UpcomingModals({ view, onClose }: { view: UpcomingView | null; onClose: () => void }) {
  if (!view) return null
  const { tour } = view
  if (view.kind === 'video') return <VideoModal title={tour.title} src={view.tour.video} onClose={onClose} />
  if (view.kind === 'notes') return <NotesModal title={tour.title} notes={view.tour.notes} onClose={onClose} />
  if (view.kind === 'flight') return <FlightModal title={tour.title} flight={view.tour.flight} onClose={onClose} />
  return (
    <Modal onClose={onClose} title="審視評價" sub={tour.title}>
      <div className="inc-sum-card" style={{ marginBottom: '1rem' }}><div className="k">平均評價</div><div className="v">{view.tour.avg} / 5.0 · {view.tour.count} 則</div></div>
      {view.tour.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
    </Modal>
  )
}

export default function Tours() {
  const { data } = useGuide()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as TourTab) || 'ongoing'
  const [view, setView] = useState<UpcomingView | null>(null)
  const count = data[tab].length

  return (
    <Screen>
      <div className="pad">
        <PageTitle>我的行程</PageTitle>
        <div className="dtabs">
          {(Object.keys(TAB_LABEL) as TourTab[]).map((t) => (
            <button key={t} className={`dtab ${tab === t ? 'active' : ''}`} onClick={() => setParams({ tab: t }, { replace: true })}>{TAB_LABEL[t]}</button>
          ))}
        </div>
        <div className="stack">
          {!count && <Empty icon="calendar" text={`目前沒有${TAB_LABEL[tab]}的行程`} hint="行程將顯示於此" />}
          {tab === 'ongoing' && data.ongoing.map((t) => <TourCard key={t.tourId} kind="ongoing" tour={t} />)}
          {tab === 'completed' && data.completed.map((t) => (
            <TourCard key={t.tourId} kind="completed" tour={t} onReviews={() => setView({ kind: 'reviews', tour: t })} />
          ))}
          {tab === 'upcoming' && data.upcoming.map((t) => (
            <TourCard key={t.tourId} kind="upcoming" tour={t}
              onVideo={() => setView({ kind: 'video', tour: t })}
              onNotes={() => setView({ kind: 'notes', tour: t })}
              onFlight={() => setView({ kind: 'flight', tour: t })} />
          ))}
        </div>
      </div>
      <UpcomingModals view={view} onClose={() => setView(null)} />
    </Screen>
  )
}
