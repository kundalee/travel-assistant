import { useState } from 'react'
import { authApi } from '../../../api/auth'
import { AsyncButton, Field, Icon, PageHead, toast } from '../../../components'
import { errMsg } from '../utils'

export default function Password() {
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')

  async function save() {
    if (pw1.length < 6) return toast('密碼至少 6 碼', 'alert-circle')
    if (pw1 !== pw2) return toast('兩次輸入的密碼不一致', 'alert-circle')
    try {
      await authApi.changePassword(pw1)
      setPw1(''); setPw2('')
      toast(authApi.mock ? '密碼已更新（展示）' : '密碼已更新')
    } catch (e) {
      toast('更新失敗：' + errMsg(e), 'alert-circle')
    }
  }

  return (
    <div className="pad">
      <PageHead icon="lock" title="修改密碼" />
      <div className="card" style={{ padding: '1.3rem', maxWidth: 460 }}>
        <Field label="新密碼"><input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="至少 6 碼" /></Field>
        <Field label="確認新密碼"><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="再次輸入" /></Field>
        <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="lock-check" />更新密碼</AsyncButton>
      </div>
    </div>
  )
}
