import { useState } from 'react'
import { AsyncButton, Icon, QueryState, toast } from '../../../components'
import { errMsg } from '../../../lib/utils'
import { authApi } from '../../../api/auth'
import { mock } from '../../../api/partner'
import type { Profile as PartnerProfile } from '../../../api/types/partner'
import { useProfile, useSaveProfile } from '../queries'

export default function Profile() {
  const profile = useProfile()
  return <QueryState queries={[profile]}>{() => <ProfileView p={profile.data!} />}</QueryState>
}

/* 表單以目前的店家資料預填 */
function ProfileView({ p }: { p: PartnerProfile }) {
  const save = useSaveProfile()
  const [name, setName] = useState(p.name)
  const [nid, setNid] = useState(p.national_id)
  const [birthday, setBirthday] = useState(p.birthday)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')

  async function saveProfile() {
    /* 表單改為後端儲存後的內容（例如去除空白、身分證字號大寫） */
    const saved = await save.mutateAsync({ name, national_id: nid, birthday })
    setName(saved.name); setNid(saved.national_id); setBirthday(saved.birthday)
    toast(mock ? '資料已儲存（展示）' : '資料已儲存')
  }

  async function changePassword() {
    if (pw1.length < 6) return toast('新密碼至少 6 碼', 'alert-circle')
    if (pw1 !== pw2) return toast('兩次密碼不一致', 'alert-circle')
    try {
      await authApi.changePassword(pw1)
      setPw1(''); setPw2('')
      toast(authApi.mock ? '密碼已更新（展示）' : '密碼已更新')
    } catch (e) {
      toast('更新失敗：' + errMsg(e), 'alert-circle')
    }
  }

  return (
    <div className="page active">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <div className="page-head"><div><h1>設定 <span className="en">Settings</span></h1><p>使用者資料與修改密碼</p></div></div>
        <div className="card" style={{ padding: '1.6rem' }}>
          <div className="alert info show" style={{ marginBottom: '1.25rem' }}>
            <Icon name="info-circle" /><span>登入身分以 Email 驗證；身分證字號、姓名與生日儲存於店家資料。</span>
          </div>
          <div className="form-row">
            <div className="form-group"><label>姓名 Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="form-group"><label>身分證字號 ID</label><input type="text" value={nid} onChange={(e) => setNid(e.target.value)} placeholder="A123456789" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>生日 Birthday</label><input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={p.email} disabled /></div>
          </div>
          <AsyncButton className="btn btn-primary" onClick={saveProfile}>
            <Icon name="device-floppy" /> 儲存資料
          </AsyncButton>
        </div>

        <div className="card" style={{ padding: '1.6rem', marginTop: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>修改密碼 <span className="h3-en">Change password</span></h3>
          <div className="form-group"><label>新密碼 New password</label><input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="至少 6 碼" /></div>
          <div className="form-group"><label>確認新密碼 Confirm</label><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <AsyncButton className="btn btn-ghost" onClick={changePassword}><Icon name="key" /> 更新密碼</AsyncButton>
        </div>
      </div>
    </div>
  )
}
