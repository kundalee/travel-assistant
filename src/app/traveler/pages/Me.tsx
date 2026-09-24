import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field, Icon, toast, type IconName } from '../../../components'
import { errMsg } from '../../../lib/utils'
import { authApi as api } from '../../../api/auth'
import { AlbumModal, Screen, SectionTitle, SubHead } from '../components'
import { useTraveler } from '../store'
import type { TravelerProfile } from '../../../api/types/traveler'

function MeRow({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={`me-row ${danger ? 'danger' : ''}`} onClick={onClick}>
      <Icon name={icon} /><span>{label}</span><Icon name="chevron-right" className="chev" />
    </button>
  )
}

export default function Me() {
  const { user, data, logout } = useTraveler()
  const nav = useNavigate()
  const [album, setAlbum] = useState<string | null>(null)
  const p = user!.profile

  return (
    <Screen>
      <div className="pad">
        <div className="card me-card">
          <div className="me-avatar">{(p.name || '團')[0]}</div>
          <div style={{ flex: 1 }}><div className="me-name">{p.name || '團員'}</div><div className="muted" style={{ fontSize: 13 }}>{p.email || '—'}</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/traveler/profile')}><Icon name="edit" />編輯</button>
        </div>

        <div className="card flush">
          <MeRow icon="id" label="個人資料與護照" onClick={() => nav('/traveler/profile')} />
          <MeRow icon="speakerphone" label="公告" onClick={() => nav('/traveler/notices')} />
          <MeRow icon="star" label="我的評價" onClick={() => nav('/traveler/my-tours?tab=completed')} />
          <MeRow icon="photo" label="旅遊回憶相簿" onClick={() => setAlbum(data.historyTours[0]?.title || '旅遊回憶相簿')} />
          <MeRow icon="receipt-2" label="歷史訂單" onClick={() => nav('/traveler/orders')} />
          <MeRow icon="history" label="歷史行程" onClick={() => nav('/traveler/history')} />
          <MeRow icon="discount" label="團購搶好康" onClick={() => nav('/traveler/groupbuy')} />
          <MeRow icon="diamond" label="精品好物分享" onClick={() => nav('/traveler/boutique')} />
          <MeRow icon="shield-check" label="防疫監控" onClick={() => nav('/traveler/epidemic')} />
          <MeRow icon="lock" label="修改密碼" onClick={() => nav('/traveler/password')} />
        </div>
        <div className="card flush" style={{ marginTop: '1.1rem' }}>
          <MeRow icon="logout" label="登出" danger onClick={logout} />
        </div>
        <p className="version">TravelAssistant · 團員 v1.0</p>
      </div>
      {album && <AlbumModal name={album} onClose={() => setAlbum(null)} />}
    </Screen>
  )
}

const RELATIONS = ['配偶', '父母', '子女', '兄弟姊妹', '朋友', '其他']

export function Profile() {
  const { user, saveProfile } = useTraveler()
  const [f, setF] = useState<TravelerProfile>(user!.profile)
  const [preview, setPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: keyof TravelerProfile) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  function pickPassport(file?: File) {
    if (!file) return
    const r = new FileReader()
    r.onload = () => setPreview(String(r.result))
    r.readAsDataURL(file)
  }

  return (
    <Screen>
      <SubHead title="個人資料" back="/traveler/me" />
      <div className="pad">
        <div className="alert info show"><Icon name="shield-lock" /><span>護照與緊急聯絡人資料僅用於出團作業，安全保存。</span></div>

        <SectionTitle icon="user">基本資料</SectionTitle>
        <div className="card form-card">
          <Field label="姓名"><input value={f.name} onChange={set('name')} /></Field>
          <div className="row-2">
            <Field label="手機"><input type="tel" value={f.phone} onChange={set('phone')} placeholder="0912-345-678" /></Field>
            <Field label="生日"><input type="date" value={f.birth} onChange={set('birth')} /></Field>
          </div>
          <Field label="Email"><input type="email" value={f.email} disabled /></Field>
        </div>

        <SectionTitle icon="id-badge-2">護照資料</SectionTitle>
        <div className="card form-card">
          <div className="row-2">
            <Field label="護照號碼"><input value={f.passport} onChange={set('passport')} placeholder="3xxxxxxxx" /></Field>
            <Field label="有效期限"><input type="date" value={f.expiry} onChange={set('expiry')} /></Field>
          </div>
          <Field label="護照照片">
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <Icon name="camera-plus" /><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>點擊上傳護照個資頁</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPassport(e.target.files?.[0])} />
            </div>
            {preview && <div className="upload-preview"><img src={preview} alt="護照預覽" /></div>}
          </Field>
        </div>

        <SectionTitle icon="urgent">緊急聯絡人</SectionTitle>
        <div className="card form-card" style={{ marginBottom: '1.4rem' }}>
          <div className="row-2">
            <Field label="姓名"><input value={f.emName} onChange={set('emName')} /></Field>
            <Field label="關係">
              <select value={f.emRel} onChange={set('emRel')}>
                <option value="">請選擇</option>
                {RELATIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <Field label="聯絡電話"><input type="tel" value={f.emPhone} onChange={set('emPhone')} placeholder="0912-000-000" /></Field>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => saveProfile({ ...f, name: f.name.trim() })}><Icon name="device-floppy" />儲存資料</button>
      </div>
    </Screen>
  )
}

export function Password() {
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')

  async function save() {
    if (pw1.length < 6) return toast('密碼至少 6 碼', 'alert-circle')
    if (pw1 !== pw2) return toast('兩次輸入的密碼不一致', 'alert-circle')
    try {
      await api.changePassword(pw1)
      setPw1(''); setPw2('')
      toast(api.mock ? '密碼已更新（展示模式）' : '密碼已更新')
    } catch (e) {
      toast('更新失敗：' + errMsg(e), 'alert-circle')
    }
  }

  return (
    <Screen>
      <SubHead title="修改密碼" back="/traveler/me" />
      <div className="pad">
        <div className="card form-card">
          <Field label="新密碼"><input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="至少 6 碼" /></Field>
          <Field label="確認新密碼"><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="再次輸入" /></Field>
          <button className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="lock-check" />更新密碼</button>
        </div>
      </div>
    </Screen>
  )
}
