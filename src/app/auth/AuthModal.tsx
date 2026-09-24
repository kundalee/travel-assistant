import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, DEMO_ACCOUNTS, type Role } from '../../api/auth'
import { Icon, toast, Toaster } from '../../components'
import { errMsg } from '../../lib/utils'
import './auth.css'
import { useAuth } from './AuthProvider'
import { PORTALS } from './portals'

const REMEMBER_KEY = 'auth_email'

function Alert({ kind, text }: { kind: 'err' | 'ok' | 'info'; text: string }) {
  if (!text) return null
  const icon = kind === 'err' ? 'alert-circle' : kind === 'ok' ? 'circle-check' : 'info-circle'
  return <div className={`am-alert ${kind}`}><Icon name={icon} /><span>{text}</span></div>
}

function LoginForm({ role }: { role: Role }) {
  const { login } = useAuth()
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY))
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const demos = authApi.mock ? DEMO_ACCOUNTS.filter((a) => a.listedOn === role) : []

  async function submit(e?: FormEvent, creds = { email, pw }) {
    e?.preventDefault()
    setErr(''); setOk('')
    if (!creds.email || !creds.pw) return setErr('請輸入電子郵件與密碼。')
    setBusy(true)
    try {
      const u = await login(creds.email.trim(), creds.pw)
      if (remember) localStorage.setItem(REMEMBER_KEY, creds.email)
      else localStorage.removeItem(REMEMBER_KEY)
      toast(u.demo ? '已以體驗帳號登入（展示資料）' : `歡迎回來，${u.name}`, u.demo ? 'flask' : undefined)
    } catch (ex) {
      setErr(errMsg(ex))
      setBusy(false)
    }
  }

  async function forgot() {
    setErr(''); setOk('')
    if (!PORTALS[role].allowRegister) return setOk('請聯絡旅行社管理員協助重設密碼。')
    if (!email) return setErr('請先輸入 Email，我們將寄送重設連結。')
    try { await authApi.forgotPassword(email.trim()); setOk('重設密碼連結已寄至 ' + email) } catch (ex) { setErr(errMsg(ex)) }
  }

  return (
    <form onSubmit={submit}>
      <Alert kind="err" text={err} /><Alert kind="ok" text={ok} />
      <div className="am-field"><label>電子郵件</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" /></div>
      <div className="am-field"><label>密碼</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="請輸入密碼" autoComplete="current-password" /></div>
      <div className="am-row">
        <label className="am-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />記住我</label>
        <button type="button" className="am-link" onClick={forgot}>忘記密碼？</button>
      </div>
      <button className="am-btn primary block" disabled={busy}>{busy ? '登入中…' : '登入'}</button>

      {demos.length > 0 && (
        <div className="am-demo">
          <Icon name="flask" />
          <div>
            <b>體驗帳號（Demo）</b>
            {demos.map((d) => (
              <div key={d.email}>
                帳號　{d.email}<br />密碼　{d.password}
                <button type="button" onClick={() => { setEmail(d.email); setPw(d.password); submit(undefined, { email: d.email, pw: d.password }) }}>
                  一鍵帶入並登入
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}

function RegisterForm({ role, onDone }: { role: 'traveler' | 'partner'; onDone: () => void }) {
  const { register } = useAuth()
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '', terms: false })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr(''); setOk('')
    if (!f.name.trim() || !f.email.trim() || !f.pw) return setErr('請填寫姓名、Email 與密碼。')
    if (f.pw.length < 6) return setErr('密碼至少 6 碼。')
    if (f.pw !== f.pw2) return setErr('兩次密碼不一致。')
    if (!f.terms) return setErr('請先同意服務條款與隱私政策。')
    setBusy(true)
    try {
      const u = await register({ name: f.name.trim(), email: f.email.trim(), password: f.pw, role })
      if (u) toast('註冊成功，已自動登入')
      else {
        setOk(role === 'partner' ? '註冊成功！請至信箱完成驗證，待管理員審核後即可登入。' : '註冊成功！請至信箱完成驗證後登入。')
        setTimeout(onDone, 1800)
      }
    } catch (ex) {
      setErr(errMsg(ex))
    } finally {
      setBusy(false)
    }
  }

  const req = <span className="am-req">*</span>
  return (
    <form onSubmit={submit}>
      <Alert kind="err" text={err} /><Alert kind="ok" text={ok} />
      <div className="am-field"><label>姓名 {req}</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="am-field"><label>電子郵件 {req}</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" /></div>
      <div className="am-two">
        <div className="am-field"><label>密碼 {req}</label><input type="password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} placeholder="至少 6 碼" /></div>
        <div className="am-field"><label>確認密碼 {req}</label><input type="password" value={f.pw2} onChange={(e) => setF({ ...f, pw2: e.target.value })} /></div>
      </div>
      <label className="am-check am-terms">
        <input type="checkbox" checked={f.terms} onChange={(e) => setF({ ...f, terms: e.target.checked })} />
        <span>我同意 <button type="button" className="am-link" onClick={() => toast('服務條款')}>服務條款</button> 與 <button type="button" className="am-link" onClick={() => toast('隱私政策')}>隱私政策</button></span>
      </label>
      <button className="am-btn primary block" disabled={busy}>{busy ? '建立中…' : `註冊${PORTALS[role].label}帳號`}</button>
    </form>
  )
}

/* 已登入、但帳號沒有此入口的身分 */
function NoRole({ role }: { role: Role }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const others = user!.roles.map((r) => PORTALS[r])
  return (
    <>
      <Alert kind="info" text={`此帳號（${user!.email}）沒有「${PORTALS[role].label}」身分。`} />
      {others.length > 0 && (
        <div className="am-portals">
          <p>前往您可使用的入口：</p>
          {others.map((p) => (
            <button key={p.role} className="am-btn ghost block" onClick={() => nav(p.path)}><Icon name={p.icon} />{p.label}</button>
          ))}
        </div>
      )}
      <button className="am-btn primary block" onClick={logout}><Icon name="logout" />切換帳號</button>
    </>
  )
}

/* 所有入口共用的登入 / 註冊視窗；網址決定要進入的身分 */
export default function AuthModal({ role }: { role: Role }) {
  const { user } = useAuth()
  const p = PORTALS[role]
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const canRegister = p.allowRegister

  async function oauth(provider: 'google' | 'facebook') {
    try { await authApi.oauth(provider) } catch (ex) { toast(errMsg(ex), 'alert-circle') }
  }

  return (
    <div className="auth-root" data-portal={role}>
      <div className="am-card" role="dialog" aria-modal="true" aria-labelledby="am-title">
        <div className="am-brand">
          <div className="am-logo"><Icon name={p.icon} /></div>
          <h1 id="am-title">{p.label}{mode === 'register' ? '註冊' : '登入'}</h1>
          <p>TravelAssistant · {p.en}</p>
        </div>

        {user ? <NoRole role={role} /> : (
          <>
            {canRegister && (
              <div className="am-tabs">
                <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>登入</button>
                <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>註冊</button>
              </div>
            )}
            {mode === 'login' || !canRegister
              ? <LoginForm role={role} />
              : <RegisterForm role={p.role as 'traveler' | 'partner'} onDone={() => setMode('login')} />}
            <div className="am-divider">或使用以下方式{mode === 'register' ? '註冊' : '登入'}</div>
            <div className="am-two">
              <button type="button" className="am-btn ghost social g" onClick={() => oauth('google')}><Icon name="brand-google" />Google</button>
              <button type="button" className="am-btn ghost social f" onClick={() => oauth('facebook')}><Icon name="brand-facebook" />Facebook</button>
            </div>
            {!canRegister && (
              <div className="am-note">
                <Icon name="info-circle" />
                <p>{p.label}帳號由旅行社管理員<b>指派開通</b>，不開放自行註冊。如需帳號或重設密碼，請聯絡您的旅行社。</p>
              </div>
            )}
          </>
        )}
      </div>
      <p className="am-foot">安全與隱私保護 · Secure &amp; Private</p>
      <Toaster />
    </div>
  )
}
