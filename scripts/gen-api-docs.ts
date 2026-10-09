/* 由各資源檔（src/api/<入口>/*.ts）產生 docs/ENDPOINTS.md（請勿手動編輯產生的檔案）
   - 端點清單：取自 endpoints.ts 的登記
   - 請求內容 / 回應：取自資源檔宣告的型別參數 get<回應>() / post<回應, 請求內容>()
   - 型別定義：從資源檔與 src/api/types/ 擷取所有用到的型別（含其引用的型別）
   執行：npm run api:docs */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import '../src/api/all'
import { ENDPOINTS, GROUPS, type Crud, type Endpoint, type Group, type Method } from '../src/api/endpoints'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const dir = (path: string) => readdirSync(new URL(path, root)).filter((f) => f.endsWith('.ts')).map((f) => path + f)

const PORTALS: [prefix: string, title: string][] = [
  ['auth', '帳號 Auth（所有入口）'], ['traveler', '團員 Traveler'], ['guide', '領隊導遊 Guide'],
  ['partner', '支援店家 Partner'], ['admin', '後台管理 Admin'],
]
/* 各入口的資源檔，與型別定義的查找順序（先找資源檔內的型別，再找該入口的 types 檔） */
const RESOURCE_FILES: Record<string, string[]> = {
  auth: ['src/api/auth.ts'],
  traveler: dir('src/api/traveler/'), guide: dir('src/api/guide/'), partner: dir('src/api/partner/'), admin: dir('src/api/admin/'),
}
const TYPE_FILES: Record<string, string[]> = {
  auth: ['src/api/auth.ts'],
  traveler: ['src/api/types/traveler.ts', 'src/lib/orders.ts'],
  guide: ['src/api/types/guide.ts', 'src/lib/orders.ts'],
  partner: ['src/api/types/partner.ts'],
  admin: ['src/api/types/admin.ts', 'src/lib/orders.ts', 'src/api/auth.ts'],
}
/* 前端專用、對後端無意義的型別改以說明取代 */
const OVERRIDES: Record<string, string> = {
  IconName: "type IconName = string // 圖示名稱，需為 src/components/Icon.tsx 已登記的名稱（例：'building-arch'）",
}
const BUILTINS = new Set(['Record', 'Omit', 'Pick', 'Partial', 'Promise', 'Array', 'File', 'Extract', 'Exclude', 'NonNullable', 'ReturnType', 'Awaited', 'Readonly'])

/* ── 小型解析器：成對括號 ── */
const OPEN = '<{([', CLOSE = '>})]'
/** 從 s[i]（開括號）找到對應的結尾位置；箭頭 => 不算括號 */
function matchEnd(s: string, i: number) {
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (OPEN.includes(s[j])) depth++
    else if (CLOSE.includes(s[j]) && !(s[j] === '>' && s[j - 1] === '=')) depth--
    if (depth === 0) return j
  }
  return -1
}
/** 以最外層逗號切開 */
function splitTop(s: string) {
  const out: string[] = []
  let depth = 0, start = 0
  for (let i = 0; i < s.length; i++) {
    if (OPEN.includes(s[i])) depth++
    else if (CLOSE.includes(s[i]) && !(s[i] === '>' && s[i - 1] === '=')) depth--
    else if (s[i] === ',' && depth === 0) { out.push(s.slice(start, i)); start = i + 1 }
  }
  out.push(s.slice(start))
  return out.map((x) => x.trim()).filter(Boolean)
}
const squash = (s: string) => s.replace(/\s+/g, ' ').replace(/;\s*}/g, ' }').trim()

/* ── 資源檔：端點 → [回應, 請求內容] ── */
const HELPER_METHOD: Record<string, Method> = { get: 'GET', post: 'POST', upload: 'POST', put: 'PUT', patch: 'PATCH', del: 'DELETE' }
const io = new Map<string, { res: string; body?: string; portal: string }>()
for (const [portal, files] of Object.entries(RESOURCE_FILES)) {
  for (const f of files) {
    const src = read(f)
    /* post<回應, 請求內容>()('/path', …)；沒有型別參數（post()(…)）= 無請求內容、無回應 */
    for (const m of src.matchAll(/\b(get|post|put|patch|del|upload)(<|\(\)\()/g)) {
      const lt = m.index! + m[1].length
      const gt = m[2] === '<' ? matchEnd(src, lt) : lt - 1
      const call = /^\(\)\(\s*'([^']+)'/.exec(src.slice(gt + 1))
      if (!call) continue
      const [res = 'void', body] = m[2] === '<' ? splitTop(src.slice(lt + 1, gt)) : []
      io.set(`${HELPER_METHOD[m[1]]} ${call[1]}`, { res: squash(res), body: body && squash(body), portal })
    }
  }
}

/* ── 型別定義：名稱 → 原始碼（含上方註解） ── */
function definitions(files: string[]) {
  const defs = new Map<string, string>()
  for (const f of files) {
    const src = read(f)
    for (const m of src.matchAll(/^(?:export )?(interface|type) ([A-Z]\w*)(<[^=>{]*>)?/gm)) {
      const name = m[2]
      if (defs.has(name)) continue
      let end: number
      if (m[1] === 'interface') {
        end = matchEnd(src, src.indexOf('{', m.index!))
      } else {
        /* type X = …：到最外層的換行為止 */
        let depth = 0
        end = src.length - 1
        for (let j = src.indexOf('=', m.index!) + 1; j < src.length; j++) {
          if (OPEN.includes(src[j])) depth++
          else if (CLOSE.includes(src[j]) && !(src[j] === '>' && src[j - 1] === '=')) depth--
          else if (src[j] === '\n' && depth === 0 && !/^\s*[|&]/.test(src.slice(j + 1, j + 40))) { end = j - 1; break }
        }
      }
      /* 連同緊接在上方的 JSDoc 註解 */
      const before = src.slice(0, m.index!)
      const doc = /(\/\*\*(?:(?!\*\/)[^])*\*\/\s*)$/.exec(before)?.[1] ?? ''
      defs.set(name, (doc + src.slice(m.index!, end + 1)).replace(/^export /gm, '').trim())
    }
  }
  return defs
}
const refs = (text: string) =>
  [...new Set(text.replace(/'[^']*'/g, '').replace(/\/\/.*$|\/\*[^]*?\*\//gm, '').match(/\b[A-Z]\w*\b/g) ?? [])].filter((n) => !BUILTINS.has(n))

/** 依序展開用到的型別（深度優先，先出現的先列） */
function collect(roots: string[], defs: Map<string, string>) {
  const seen = new Set<string>(), order: string[] = [], missing: string[] = []
  const visit = (n: string) => {
    if (seen.has(n)) return
    seen.add(n)
    const def = OVERRIDES[n] ?? defs.get(n)
    if (!def) { missing.push(n); return }
    order.push(n)
    /* 引用的型別：本體與 extends 的型別（去掉開頭的註解與自己的名稱） */
    if (!OVERRIDES[n]) refs(def.replace(/^\/\*\*[^]*?\*\/\s*/, '').replace(new RegExp(`^(interface|type) ${n}\\b`), '')).forEach(visit)
  }
  roots.forEach(visit)
  return { order, missing }
}

/* ── 產生文件 ── */
const CRUD: Crud[] = ['C', 'R', 'U', 'D']
const groups = Object.keys(GROUPS) as Group[]
const inPortal = (g: Group, p: string) => g === p || g.startsWith(p + '.')
const count = (g: Group, c: Crud) => ENDPOINTS.filter((e) => e.group === g && e.crud === c).length
const anchor = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/\s+/g, '-')
const cell = (s: string) => '`' + s.replace(/\|/g, '\\|') + '`'
const ioOf = (e: Endpoint) => io.get(`${e.method} ${e.path}`)
function requestCell(e: Endpoint) {
  const body = ioOf(e)?.body
  if (!body || body === 'void') return '—'
  return (e.multipart ? 'multipart ' : '') + cell(body)
}
function responseCell(e: Endpoint) {
  const res = ioOf(e)?.res ?? 'void'
  return res === 'void' ? '`204`' : cell(res)
}

const lines: string[] = [
  '# API Endpoints',
  '',
  '> Generated from the resource files in [`src/api/`](../src/api) by `npm run api:docs`. Do not edit by hand.',
  '> Conventions and business rules: [API.md](API.md).',
  '',
  `**${ENDPOINTS.length} endpoints** in ${groups.length} groups. C = create, R = read, U = update, D = delete.`,
  '`VITE_API_REAL` takes the group keys below (see `.env.example`).',
  '',
  '**How to read the tables**',
  '- **Path params** are the `:name` parts of the path.',
  '- **Request** is the JSON body. `multipart` means `multipart/form-data`: `File` / `File[]` fields are file parts, other fields are strings.',
  '- **Response** is the JSON body of a `200` / `201`. `204` means no body.',
  '- The **Types** section of each portal defines every type used in its tables.',
  '- Errors return non-2xx with `{ "message": string }` (shown to the user as-is).',
  '',
  '| Portal | C | R | U | D | Total |',
  '| --- | :-: | :-: | :-: | :-: | :-: |',
]
for (const [p, title] of PORTALS) {
  const gs = groups.filter((g) => inPortal(g, p))
  const eps = ENDPOINTS.filter((e) => gs.includes(e.group))
  lines.push(`| [${title}](#${anchor(title)}) | ${CRUD.map((c) => eps.filter((e) => e.crud === c).length || '–').join(' | ')} | ${eps.length} |`)
}

let missingTotal = 0
for (const [p, title] of PORTALS) {
  const gs = groups.filter((g) => inPortal(g, p))
  const eps = ENDPOINTS.filter((e) => gs.includes(e.group))
  lines.push('', `## ${title}`, '', '| Group (`VITE_API_REAL` key) | C | R | U | D | Total |', '| --- | :-: | :-: | :-: | :-: | :-: |')
  for (const g of gs) {
    lines.push(`| ${GROUPS[g]} (\`${g}\`) | ${CRUD.map((c) => count(g, c) || '–').join(' | ')} | ${ENDPOINTS.filter((e) => e.group === g).length} |`)
  }
  for (const g of gs) {
    lines.push('', `### ${GROUPS[g]}`, '', '| | Method | Path | Request | Response | 說明 |', '| :-: | --- | --- | --- | --- | --- |')
    for (const e of ENDPOINTS.filter((x) => x.group === g)) {
      lines.push(`| ${e.crud ?? ''} | ${e.method} | \`${e.path}\` | ${requestCell(e)} | ${responseCell(e)} | ${e.desc} |`)
    }
  }

  /* 本入口用到的型別 */
  const defs = definitions([...RESOURCE_FILES[p], ...TYPE_FILES[p]])
  const roots = eps.flatMap((e) => { const x = ioOf(e); return x ? [...refs(x.res), ...(x.body ? refs(x.body) : [])] : [] })
  const { order, missing } = collect(roots, defs)
  if (order.length) {
    lines.push('', `### ${title.split(' ')[0]} · Types`, '', '```ts', order.map((n) => OVERRIDES[n] ?? defs.get(n)).join('\n\n'), '```')
  }
  if (missing.length) { missingTotal += missing.length; console.warn(`[api:docs] ${p}: 找不到型別定義 ${missing.join(', ')}`) }
}

const unresolved = ENDPOINTS.filter((e) => !ioOf(e))
if (unresolved.length) console.warn(`[api:docs] 無法從資源檔讀取型別：${unresolved.map((e) => `${e.method} ${e.path}`).join(', ')}`)
writeFileSync(new URL('docs/ENDPOINTS.md', root), lines.join('\n') + '\n')
console.log(`docs/ENDPOINTS.md: ${ENDPOINTS.length} endpoints${missingTotal || unresolved.length ? ' (with warnings)' : ''}`)
