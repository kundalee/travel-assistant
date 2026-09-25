/* 由 src/api/endpoints.ts 產生 docs/ENDPOINTS.md（請勿手動編輯產生的檔案）
   執行：npm run api:docs */
import { writeFileSync } from 'node:fs'
import '../src/api/all'
import { ENDPOINTS, GROUPS, type Crud, type Group } from '../src/api/endpoints'

const PORTALS: [prefix: string, title: string][] = [
  ['auth', '帳號 Auth（所有入口）'], ['traveler', '團員 Traveler'], ['guide', '領隊導遊 Guide'],
  ['partner', '支援店家 Partner'], ['admin', '後台管理 Admin'],
]
const CRUD: Crud[] = ['C', 'R', 'U', 'D']
const groups = Object.keys(GROUPS) as Group[]
const inPortal = (g: Group, p: string) => g === p || g.startsWith(p + '.')
const count = (g: Group, c: Crud) => ENDPOINTS.filter((e) => e.group === g && e.crud === c).length
const anchor = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/\s+/g, '-')

const lines: string[] = [
  '# API Endpoints',
  '',
  '> Generated from the resource files in [`src/api/`](../src/api) by `npm run api:docs`. Do not edit by hand.',
  '> Request / response shapes and rules: [API.md](API.md).',
  '',
  `**${ENDPOINTS.length} endpoints** in ${groups.length} groups. C = create, R = read, U = update, D = delete.`,
  '`VITE_API_REAL` takes the group keys below (see `.env.example`).',
  '',
  '| Portal | C | R | U | D | Total |',
  '| --- | :-: | :-: | :-: | :-: | :-: |',
]
for (const [p, title] of PORTALS) {
  const gs = groups.filter((g) => inPortal(g, p))
  const eps = ENDPOINTS.filter((e) => gs.includes(e.group))
  lines.push(`| [${title}](#${anchor(title)}) | ${CRUD.map((c) => eps.filter((e) => e.crud === c).length || '–').join(' | ')} | ${eps.length} |`)
}
for (const [p, title] of PORTALS) {
  const gs = groups.filter((g) => inPortal(g, p))
  lines.push('', `## ${title}`, '', '| Group (`VITE_API_REAL` key) | C | R | U | D | Total |', '| --- | :-: | :-: | :-: | :-: | :-: |')
  for (const g of gs) {
    lines.push(`| ${GROUPS[g]} (\`${g}\`) | ${CRUD.map((c) => count(g, c) || '–').join(' | ')} | ${ENDPOINTS.filter((e) => e.group === g).length} |`)
  }
  for (const g of gs) {
    lines.push('', `### ${GROUPS[g]}`, '', '| | Method | Path | 說明 |', '| :-: | --- | --- | --- |')
    for (const e of ENDPOINTS.filter((x) => x.group === g)) lines.push(`| ${e.crud ?? ''} | ${e.method} | \`${e.path}\` | ${e.desc} |`)
  }
}
writeFileSync(new URL('../docs/ENDPOINTS.md', import.meta.url), lines.join('\n') + '\n')
console.log(`docs/ENDPOINTS.md: ${ENDPOINTS.length} endpoints`)
