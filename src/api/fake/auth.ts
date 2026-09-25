/* 假後端：登入 / 註冊 */
import { DEMO_ACCOUNTS, publicUser } from '../mocks/auth'
import { authEndpoints as ep, type RegisterInput } from '../auth'
import { FakeError, json, makeToken, requireUser, route } from './server'

route(ep.login, (ctx) => {
  const { email = '', password = '' } = json<{ email?: string; password?: string }>(ctx)
  const acc = DEMO_ACCOUNTS.find((a) => a.email === email.toLowerCase() && a.password === password)
  if (!acc) throw new FakeError(401, '電子郵件或密碼錯誤。')
  return { token: makeToken(acc.id), user: publicUser(acc.id) }
})

route(ep.register, (ctx) => {
  const input = json<RegisterInput>(ctx)
  if (DEMO_ACCOUNTS.some((a) => a.email === input.email?.toLowerCase())) throw new FakeError(409, '此 Email 已註冊，請直接登入。')
  throw new FakeError(400, '展示模式無法註冊，請使用體驗帳號登入。')
})

route(ep.oauth, (ctx) => {
  throw new FakeError(501, `${ctx.params.provider === 'google' ? 'Google' : 'Facebook'} 登入需串接後端後才能使用。`)
})

route(ep.forgotPassword, () => undefined)

route(ep.changePassword, (ctx) => { requireUser(ctx) })

route(ep.logout, () => undefined)

route(ep.me, (ctx) => {
  const user = publicUser(requireUser(ctx))
  if (!user) throw new FakeError(401, '登入已失效，請重新登入。')
  return user
})
