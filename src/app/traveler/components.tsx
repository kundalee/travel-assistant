import qrcode from 'qrcode-generator'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncButton, Empty, Field, Icon, type IconName, Modal, QueryState, Tabs, toast, useBusy } from '../../components'
import { fmt } from '../../lib/utils'
import { useAlbum, useCreateReview, useFavoritePhoto, usePublishMemory, useUploadToAlbum } from './queries'
import type { AlbumPhoto, Boutique, CatalogTour, GroupBuyItem, Notice } from '../../api/types/traveler'

export function Screen({ children }: { children: ReactNode }) {
  return <section className="screen active">{children}</section>
}

export function SubHead({ title, back, children }: { title: ReactNode; back: string; children?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="sub-head">
      <button className="back" onClick={() => nav(back)} aria-label="返回"><Icon name="arrow-left" /></button>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h2 className="page-title">{children}</h2>
}

export function SectionTitle({ icon, children, more, onMore }: { icon: IconName; children: ReactNode; more?: string; onMore?: () => void }) {
  return (
    <div className="section-title">
      <Icon name={icon} />{children}{more && <span className="more" onClick={onMore}>{more}</span>}
    </div>
  )
}

/* 單選卡片（付款 / 取貨方式） */
export function RadioCards<K extends string>({ options, value, onChange }: {
  options: { key: K; icon: IconName; title: string; desc: string }[]
  value: K
  onChange: (k: K) => void
}) {
  return (
    <div>
      {options.map((o) => (
        <div key={o.key} className={`radio-card ${value === o.key ? 'sel' : ''}`} onClick={() => onChange(o.key)} role="radio" aria-checked={value === o.key}>
          <div className="ico"><Icon name={o.icon} /></div>
          <div className="txt"><strong>{o.title}</strong><span>{o.desc}</span></div>
          <div className="dot" />
        </div>
      ))}
    </div>
  )
}

export function NoticeCard({ n }: { n: Notice }) {
  const daily = n.type === '每日公告'
  return (
    <div className="card notice-card">
      <div className={`notice-ico ${daily ? 'daily' : ''}`}><Icon name={daily ? 'speakerphone' : 'building'} /></div>
      <div style={{ flex: 1 }}>
        <div className="notice-top"><b>{n.title}</b><span>{n.time}</span></div>
        <p>{n.body}</p>
        <div className="notice-meta"><span className="chip static">{n.kind}</span><span><Icon name="user" /> {n.by}</span></div>
      </div>
    </div>
  )
}

export function GroupBuyCard({ g, onAdd }: { g: GroupBuyItem; onAdd: () => void }) {
  const off = Math.round((1 - g.price / g.orig) * 100)
  return (
    <div className="gb-card">
      <div className="gb-emo">{g.emo}</div>
      <div className="gb-info">
        <h4>{g.name}</h4><div className="desc">{g.desc}</div>
        <div className="gb-price"><b>NT$ {fmt(g.price)}</b><s>NT$ {fmt(g.orig)}</s><span className="off">-{off}%</span></div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={onAdd}><Icon name="shopping-cart-plus" />加入購物車</button>
      </div>
    </div>
  )
}

export function BoutiqueCard({ b }: { b: Boutique }) {
  return (
    <div className="gb-card">
      <div className="gb-emo">{b.emo}</div>
      <div className="gb-info">
        <h4>{b.name}</h4><div className="desc">{b.desc}</div>
        <div className="gb-price"><b>NT$ {fmt(b.price)}</b></div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => window.open(b.url, '_blank', 'noopener')}>
          <Icon name="external-link" />前往購買
        </button>
      </div>
    </div>
  )
}

/* 行程目錄卡片 → 詳情 */
export function CatalogCard({ t }: { t: CatalogTour }) {
  const nav = useNavigate()
  return (
    <div className="card tap tour-card" onClick={() => nav(`/traveler/tours/${t.id}`)}>
      <div className="thumb">
        <img src={t.img} alt={t.title} loading="lazy" />
        <span className="region">{t.region}</span><span className="price">NT$ {fmt(t.price)}</span>
      </div>
      <div className="body">
        <h3>{t.title}</h3>
        <div className="meta-row"><Icon name="map-pin" />{t.dest}</div>
        <div className="meta-row"><Icon name="calendar" />{t.dates}</div>
        <div className="tags">{t.tags.map((x) => <span className="tag" key={x}>{x}</span>)}</div>
      </div>
    </div>
  )
}

/* ── 團員相簿 + 燈箱 ── */
function Lightbox({ photo, onClose }: { photo: AlbumPhoto; onClose: () => void }) {
  const album = useAlbum()
  const fav = useFavoritePhoto()
  const favorite = !!album.data?.find((p) => p.id === photo.id)?.favorite

  async function favorite_() {
    if (favorite) return toast('已在收藏中', 'heart')
    await fav.mutateAsync(photo.id)
    toast('已加入收藏', 'heart')
  }

  async function share() {
    try { await navigator.clipboard.writeText(photo.src); toast('分享連結已複製', 'share') } catch { toast('無法複製連結', 'alert-circle') }
  }

  return (
    <div className="lightbox open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="lb-close" onClick={onClose} aria-label="關閉"><Icon name="x" /></button>
      <img src={photo.src} alt={photo.cap} />
      <div className="lb-info"><div className="cap">{photo.cap}</div><div className="up">由 {photo.up} 上傳</div></div>
      <div className="lb-actions">
        <AsyncButton onClick={favorite_} aria-label="收藏"><Icon name={favorite ? 'heart-filled' : 'heart'} /></AsyncButton>
        <a href={photo.src} download target="_blank" rel="noopener" aria-label="下載"><Icon name="download" /></a>
        <button onClick={share} aria-label="分享"><Icon name="share" /></button>
      </div>
    </div>
  )
}

export function PhotoGrid({ photos, className = '' }: { photos: AlbumPhoto[]; className?: string }) {
  const [open, setOpen] = useState<AlbumPhoto | null>(null)
  return (
    <>
      <div className={`photo-grid ${className}`}>
        {photos.map((p, i) => (
          <div className="cell" key={i} onClick={() => setOpen(p)}><img src={p.src} alt="" loading="lazy" /><div className="cap">{p.cap}</div></div>
        ))}
      </div>
      {open && <Lightbox photo={open} onClose={() => setOpen(null)} />}
    </>
  )
}

type AlbumTab = 'all' | 'guide' | 'mine'

export function AlbumModal({ name, onClose }: { name: string; onClose: () => void }) {
  const album = useAlbum()
  const uploadToAlbum = useUploadToAlbum(name)
  const [tab, setTab] = useState<AlbumTab>('all')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, run] = useBusy()
  const list = (album.data ?? []).filter((p) => tab === 'all' || p.by === tab)

  function upload(files: File[]) {
    if (!files.length) return
    void run(async () => {
      const r = await uploadToAlbum.mutateAsync(files).catch(() => undefined)
      if (r) toast(`已上傳 ${r.count} 張照片`)
    })
  }

  return (
    <Modal onClose={onClose} title="團員相簿" sub={name}>
      <div className="alert info show"><Icon name="users" /><span>僅限同團成員查看與分享</span></div>
      <Tabs<AlbumTab> value={tab} onChange={setTab} tabs={[['all', '全部'], ['guide', '導遊上傳'], ['mine', '我的照片']]} />
      <QueryState queries={[album]}>{() => list.length
        ? <PhotoGrid photos={list} className="bleed" />
        : <Empty icon="photo-off" text="尚無照片" hint={tab === 'mine' ? '上傳您的旅遊回憶吧！' : '導遊尚未上傳照片'} />}</QueryState>
      <button className="btn btn-ghost btn-block" style={{ marginTop: '1rem' }} disabled={uploading} aria-busy={uploading || undefined} onClick={() => fileRef.current?.click()}><Icon name="camera-plus" />{uploading ? '上傳中…' : '上傳照片'}</button>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { upload([...(e.target.files || [])]); e.target.value = '' }} />
    </Modal>
  )
}

/* ── 簽到 QR / 集合地圖 ── */
export function QrModal({ title, payload, onClose }: { title: string; payload: string; onClose: () => void }) {
  const src = useMemo(() => {
    try {
      const qr = qrcode(0, 'M')
      qr.addData(payload)
      qr.make()
      return qr.createDataURL(5, 8)
    } catch {
      return ''
    }
  }, [payload])
  return (
    <Modal center onClose={onClose} title="簽到 QR Code" sub={title}>
      <div className="qr-box">
        <div className="qr-frame">{src ? <img src={src} alt={payload} /> : <div className="qr-fail">QR 產生失敗</div>}</div>
        <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>出團當日請向導遊出示此 QR Code 完成報到簽到</p>
        <div className="qr-code">{payload}</div>
      </div>
    </Modal>
  )
}

export function MapModal({ place, onClose }: { place: string; onClose: () => void }) {
  const q = encodeURIComponent(place)
  return (
    <Modal center onClose={onClose} title="集合地點" sub={place}>
      <iframe className="map-frame" title="集合地點" src={`https://maps.google.com/maps?q=${q}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="guide-strip" style={{ marginTop: '1rem' }}>
        <div className="n-ico depart"><Icon name="map-pin" /></div>
        <div style={{ flex: 1 }}><div className="g-name">{place}</div><div className="g-role">請準時抵達，逾時恕不等候</div></div>
        <a className="btn btn-ghost btn-sm" target="_blank" rel="noopener" href={`https://maps.google.com/maps?q=${q}`}><Icon name="external-link" />導航</a>
      </div>
    </Modal>
  )
}

/* ── 撰寫評價 ── */
export function ReviewModal({ tourId, tourTitle, onClose }: { tourId: string; tourTitle: string; onClose: () => void }) {
  const createReview = useCreateReview()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [anonymous, setAnonymous] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function submit() {
    if (!rating) return toast('請選擇評分', 'alert-circle')
    if (!title.trim()) return toast('請填寫評價標題', 'alert-circle')
    if (!content.trim()) return toast('請填寫詳細評價', 'alert-circle')
    await createReview.mutateAsync({ tourId, rating, title: title.trim(), content: content.trim(), anonymous, photos })
    toast('感謝您的評價！')
    onClose()
  }

  const shown = hover || rating
  return (
    <Modal onClose={onClose} title="撰寫評價" sub={tourTitle}>
      <label className="center-label">整體評價</label>
      <div className="stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((r) => (
          <button key={r} type="button" onClick={() => setRating(r)} onMouseEnter={() => setHover(r)} aria-label={`${r} 星`}>
            <Icon name={r <= shown ? 'star-filled' : 'star'} className={r <= shown ? 'on' : ''} />
          </button>
        ))}
      </div>
      <div className="rate-labels"><span>非常不滿意</span><span>非常滿意</span></div>
      <Field label="評價標題" style={{ marginTop: '1.1rem' }}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="簡短描述您的體驗" /></Field>
      <Field label="詳細評價"><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="分享旅行體驗、導遊服務、住宿品質…" /></Field>
      <Field label="上傳照片（選填）">
        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
          <Icon name="photo-plus" /><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>最多 5 張</p>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setPhotos([...(e.target.files || [])].slice(0, 5))} />
        </div>
        {photos.length > 0 && <p className="hint">已選擇 {photos.length} 張照片</p>}
      </Field>
      <label className="check-line start"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /><span>匿名評價</span></label>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="send" />提交評價</AsyncButton>
    </Modal>
  )
}

/* ── 我的旅遊回憶 ── */
export function MemoryModal({ tourId, tourTitle, onClose }: { tourId: string; tourTitle: string; onClose: () => void }) {
  const publishMemory = usePublishMemory()
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function publish() {
    if (!files.length) return toast('請至少選擇一張照片', 'alert-circle')
    await publishMemory.mutateAsync({ tourId, files, caption: caption.trim() })
    toast('旅遊回憶已發佈 🎉')
    onClose()
  }

  return (
    <Modal onClose={onClose} title="我的旅遊回憶" sub={tourTitle}>
      <Field label="選擇照片">
        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
          <Icon name="camera-heart" /><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>點擊選擇旅遊照片</p>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles([...(e.target.files || [])])} />
        </div>
        {files.length > 0 && <p className="hint">已選擇 {files.length} 張照片</p>}
      </Field>
      <Field label="照片說明"><textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="寫下這趟旅程的回憶…" /></Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={publish}><Icon name="send" />發佈回憶</AsyncButton>
    </Modal>
  )
}
