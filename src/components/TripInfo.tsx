import { Icon } from './Icon'
import { Modal } from './Modal'

/* 行程出發前資訊：說明影片 / 相關說明 / 航班資訊（領隊、團員共用） */

export interface FlightInfo {
  dep: string
  depAir: string
  ret: string
  retAir: string
  pnr: string
  seat: string
}

export function VideoModal({ title, src, onClose }: { title: string; src: string; onClose: () => void }) {
  return (
    <Modal center onClose={onClose} title="說明影片" sub={title}>
      <div className="video-wrap">
        <iframe title="說明影片" src={`${src}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    </Modal>
  )
}

export function NotesModal({ title, notes, onClose }: { title: string; notes: string[]; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="相關說明" sub={title}>
      {notes.length
        ? notes.map((n) => <div className="incl-item" key={n}><Icon name="point" className="accent" /><span>{n}</span></div>)
        : <p className="muted">尚無說明</p>}
    </Modal>
  )
}

export function FlightModal({ title, flight, onClose }: { title: string; flight: FlightInfo; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title="航班資訊" sub={title}>
      <div className="flight-card"><div className="flight-h"><Icon name="plane-departure" />去程</div><div className="flight-route">{flight.dep}</div><div className="flight-air">{flight.depAir}</div></div>
      <div className="flight-card"><div className="flight-h"><Icon name="plane-arrival" />回程</div><div className="flight-route">{flight.ret}</div><div className="flight-air">{flight.retAir}</div></div>
      <div className="info-grid" style={{ marginTop: 12 }}>
        <div className="info-cell"><div className="k"><Icon name="ticket" />訂位代號 PNR</div><div className="v">{flight.pnr}</div></div>
        <div className="info-cell"><div className="k"><Icon name="armchair" />劃位</div><div className="v" style={{ fontSize: 13 }}>{flight.seat}</div></div>
      </div>
    </Modal>
  )
}
