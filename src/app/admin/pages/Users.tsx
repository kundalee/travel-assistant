import { useState } from 'react'
import { AsyncButton, Field, Icon, Modal, PageHead, QueryState, SearchBox, TableEmpty, toast } from '../../../components'
import { DataNote } from '../components/DataNote'
import { ROLE_TW } from '../../../api/mocks/admin'
import { useAdminData, useCrud } from '../queries'
import type { AdminData } from '../../../api/types/admin'
import type { Role, User } from '../../../api/types/admin'
import { avatarUrl, includesQ } from '../utils'

const ROLES = Object.keys(ROLE_TW) as Role[]

/* 身分可複選（一個帳號可同時是領隊與團員等） */
function RolePicker({ value, onChange }: { value: Role[]; onChange: (r: Role[]) => void }) {
  const toggle = (r: Role) => onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r])
  return (
    <div className="opt-grid">
      {ROLES.map((r) => (
        <button key={r} type="button" className={`opt sq ${value.includes(r) ? 'on' : ''}`} onClick={() => toggle(r)}>
          <span className="mk">{value.includes(r) && <Icon name="check" />}</span>{ROLE_TW[r]}
        </button>
      ))}
    </div>
  )
}

function UserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { update } = useCrud()
  const [name, setName] = useState(user.full_name || '')
  const [roles, setRoles] = useState<Role[]>(user.roles)
  const [phone, setPhone] = useState(user.phone || '')
  const [active, setActive] = useState(user.is_active)

  async function save() {
    if (!name.trim()) return toast('請輸入姓名', 'alert-circle')
    if (!roles.length) return toast('請至少選擇一個身分', 'alert-circle')
    const changes = { full_name: name.trim(), roles, phone: phone.trim() || null, is_active: active }
    if (await update('users', user.id, changes, '已更新使用者')) onClose()
  }

  return (
    <Modal onClose={onClose} title="編輯使用者" sub="角色與狀態">
      <Field label="姓名"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" /></Field>
      <Field label="信箱"><input value={user.email} disabled /></Field>
      <Field label="身分" hint="可複選"><RolePicker value={roles} onChange={setRoles} /></Field>
      <Field label="電話"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="選填" /></Field>
      <Field label="帳號狀態" hint="停用後無法登入">
        <div className="seg">
          <button type="button" className={active ? 'on' : ''} onClick={() => setActive(true)}>啟用</button>
          <button type="button" className={!active ? 'on' : ''} onClick={() => setActive(false)}>停用</button>
        </div>
      </Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="device-floppy" />儲存</AsyncButton>
    </Modal>
  )
}

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const { create } = useCrud()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<Role[]>(['guide'])
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  async function save() {
    if (!name.trim()) return toast('請輸入姓名', 'alert-circle')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast('請輸入有效的信箱', 'alert-circle')
    if (password.length < 8) return toast('初始密碼至少 8 碼', 'alert-circle')
    if (!roles.length) return toast('請至少選擇一個身分', 'alert-circle')
    const item = { full_name: name.trim(), email: email.trim(), password, roles, phone: phone.trim() || null }
    if (await create('users', item, '已建立使用者帳號，請將初始密碼告知使用者', 'user-check')) onClose()
  }

  return (
    <Modal onClose={onClose} title="建立使用者帳號" sub="領隊 / 店家 / 管理員">
      <Field label="姓名"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="王大明" /></Field>
      <Field label="信箱"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guide@agency.com" /></Field>
      <Field label="身分" hint="可複選"><RolePicker value={roles} onChange={setRoles} /></Field>
      <Field label="電話"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="選填" /></Field>
      <Field label="初始密碼" hint="至少 8 碼；建立後請告知使用者，登入後可自行修改">
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 碼" autoComplete="new-password" />
      </Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="user-plus" />建立帳號</AsyncButton>
    </Modal>
  )
}

export default function Users() {
  const { queries, data } = useAdminData('users')
  return <QueryState queries={queries}>{() => <UsersView data={data!} />}</QueryState>
}

function UsersView({ data }: { data: Pick<AdminData, 'users'> }) {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | 'all'>('all')
  const [editing, setEditing] = useState<User | null>(null)
  const [creating, setCreating] = useState(false)

  const list = data.users.filter((u) =>
    (role === 'all' || u.roles.includes(role)) &&
    includesQ([u.full_name, u.email, u.phone, ...u.roles.map((r) => ROLE_TW[r])], q))

  return (
    <div className="pad">
      <PageHead icon="users" title="使用者管理">
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="user-plus" />建立使用者帳號</button>
      </PageHead>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="全文檢索：姓名 / 信箱 / 電話 / 角色" />
        <select className="filt" value={role} onChange={(e) => setRole(e.target.value as Role | 'all')}>
          <option value="all">全部角色</option>
          <option value="admin">作業人員（管理員）</option>
          <option value="guide">領隊導遊管理</option>
          <option value="member">團會員管理</option>
          <option value="agent">支援店家</option>
        </select>
      </div>
      <DataNote group="admin.users" />
      <div className="card-wrap">
        <table className="dtable">
          <thead><tr><th style={{ width: 56 }} /><th>姓名 / 信箱</th><th style={{ width: 150 }}>電話</th><th style={{ width: 130 }}>角色</th><th style={{ width: 90 }}>狀態</th><th style={{ width: 120 }}>最後登入</th><th style={{ width: 70 }}>工具</th></tr></thead>
          <tbody>
            {list.length ? list.map((u) => (
              <tr key={u.id}>
                <td><img className="lav" style={{ width: 36, height: 36 }} src={avatarUrl(u.full_name)} alt="" /></td>
                <td><div className="t-title">{u.full_name || '（未命名）'}</div><div className="t-sub">{u.email}</div></td>
                <td className="t-sub">{u.phone || '—'}</td>
                <td><div className="rbadges">{u.roles.map((r) => <span key={r} className={`rbadge ${r}`}>{ROLE_TW[r]}</span>)}</div></td>
                <td><span className={`st-badge ${u.is_active ? 'on' : 'off'}`}>{u.is_active ? '啟用' : '停用'}</span></td>
                <td className="t-sub">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('zh-TW') : '—'}</td>
                <td><div className="dt-acts"><button onClick={() => setEditing(u)} title="編輯"><Icon name="edit" /></button></div></td>
              </tr>
            )) : <TableEmpty cols={7} icon="users" text="查無使用者" />}
          </tbody>
        </table>
      </div>

      {editing && <UserModal key={editing.id} user={editing} onClose={() => setEditing(null)} />}
      {creating && <CreateUserModal onClose={() => setCreating(false)} />}
    </div>
  )
}
