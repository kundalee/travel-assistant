import type { Role } from '../../api/auth'

/* 由 vite.config.ts 的 define 注入（Node 腳本中不存在） */
declare const __TEST_ACCOUNTS__: string | undefined
import { DEMO_ACCOUNTS } from '../../api/mocks/auth'
import { isFake } from '../../api/client'

export interface TestAccount {
  email: string
  password: string
}

/* 真正後端的測試帳號：.env.local 的 TEST_ACCOUNTS，只由 dev server 注入（vite.config.ts 的 __TEST_ACCOUNTS__），
   正式建置一律為空（密碼不進版本控制、不進正式網站）。
   格式：身分:email:密碼，多組以逗號分隔，例如 admin:admin@example.com:change-me-123 */
function realTestAccounts(): (TestAccount & { role: string })[] {
  const raw = typeof __TEST_ACCOUNTS__ === 'string' ? __TEST_ACCOUNTS__ : ''
  return raw.split(',').map((s) => s.trim()).filter(Boolean).flatMap((s) => {
    const [role, email, ...pw] = s.split(':')
    return role && email && pw.length ? [{ role, email, password: pw.join(':') }] : []
  })
}

/** 登入視窗列出的快速登入帳號：假後端用體驗帳號，真正後端用開發測試帳號 */
export function testAccountsFor(role: Role): TestAccount[] {
  if (isFake('auth')) return DEMO_ACCOUNTS.filter((a) => a.listedOn === role)
  return realTestAccounts().filter((a) => a.role === role)
}

/** 標題：體驗帳號（假後端）或測試帳號（開發中的真正後端） */
export const testAccountsLabel = () => (isFake('auth') ? '體驗帳號（Demo）' : '測試帳號（開發用）')
