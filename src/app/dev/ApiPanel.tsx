import { useState, useSyncExternalStore } from 'react'
import { callLog, type CallRecord } from '../../api/calls'
import { isFake } from '../../api/client'
import '../../api/all'
import { endpointKey, ENDPOINTS, GROUPS, type Crud, type Group } from '../../api/endpoints'
import { unimplemented } from '../../api/fake'
import { Icon, toast } from '../../components'
import './api-panel.css'

const CRUD: Crud[] = ['C', 'R', 'U', 'D']
const groups = Object.keys(GROUPS) as Group[]

/* 開發用：列出所有端點（各資源檔宣告）、各群組送往真實或假後端，以及呼叫次數 */
export default function ApiPanel() {
  const calls = useSyncExternalStore(callLog.subscribe, callLog.get)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'endpoints' | 'recent'>('endpoints')

  const countOf = (key: string) => calls.filter((c) => c.key === key).length
  const called = ENDPOINTS.filter((e) => countOf(endpointKey(e)) > 0).length
  const missing = unimplemented().filter((e) => isFake(e.group))

  /* 複製為 Markdown 清單（已呼叫的打勾） */
  async function copyList() {
    const md = groups.map((g) => `### ${GROUPS[g]}（${g}）\n` + ENDPOINTS.filter((e) => e.group === g)
      .map((e) => `- [${countOf(endpointKey(e)) ? 'x' : ' '}] ${e.crud ? e.crud + ' ' : ''}\`${e.method} ${e.path}\` — ${e.desc}`).join('\n')).join('\n\n')
    try { await navigator.clipboard.writeText(md); toast('已複製端點清單') } catch { toast('無法複製', 'alert-circle') }
  }

  if (!open) {
    return (
      <button className="api-fab" onClick={() => setOpen(true)} title="API 呼叫紀錄">
        API <b>{called}</b>/{ENDPOINTS.length}
      </button>
    )
  }

  return (
    <div className="api-panel">
      <div className="ap-head">
        <div>
          <h3>API 端點</h3>
          <p>共 {ENDPOINTS.length} 個端點 · 已呼叫 {called} 個 · 共 {calls.length} 次</p>
        </div>
        <button className="ap-x" onClick={() => setOpen(false)} aria-label="關閉"><Icon name="x" /></button>
      </div>
      <div className="ap-tabs">
        <button className={tab === 'endpoints' ? 'on' : ''} onClick={() => setTab('endpoints')}>端點</button>
        <button className={tab === 'recent' ? 'on' : ''} onClick={() => setTab('recent')}>最近呼叫</button>
        <span className="ap-spacer" />
        <button onClick={copyList}>複製清單</button>
        <button onClick={callLog.clear}>清除紀錄</button>
      </div>

      <div className="ap-body">
        {missing.length > 0 && (
          <div className="ap-warn">假後端尚未實作：{missing.map((e) => endpointKey(e)).join('、')}</div>
        )}

        {tab === 'endpoints' ? groups.map((g) => {
          const list = ENDPOINTS.filter((e) => e.group === g)
          const summary = CRUD.map((c) => [c, list.filter((e) => e.crud === c).length] as const).filter(([, n]) => n)
          const hit = list.filter((e) => countOf(endpointKey(e)) > 0).length
          const fake = isFake(g)
          return (
            <div key={g} className="ap-group">
              <div className="ap-group-title">
                <span>{GROUPS[g]}</span>
                <span className={`ap-mode ${fake ? 'fake' : 'real'}`} title={`VITE_API_REAL 群組：${g}`}>{fake ? '假' : '真實'}</span>
                <span className="ap-summary">{summary.map(([c, n]) => `${c}${n}`).join(' · ')}</span>
                <span className="ap-hit">{hit}/{list.length}</span>
              </div>
              {list.map((e) => {
                const n = countOf(endpointKey(e))
                return (
                  <div key={endpointKey(e)} className={`ap-row ${n ? 'hit' : ''}`}>
                    <span className={`ap-crud c-${e.crud ?? 'none'}`}>{e.crud ?? ''}</span>
                    <span className={`ap-method m-${e.method}`}>{e.method}</span>
                    <div className="ap-main"><code>{e.path}</code><span>{e.desc}</span></div>
                    <span className="ap-count">{n || '—'}</span>
                  </div>
                )
              })}
            </div>
          )
        }) : (
          [...calls].reverse().slice(0, 50).map((c: CallRecord, i) => (
            <div key={i} className="ap-row hit">
              <span className={`ap-mode ${c.mode}`}>{c.mode === 'fake' ? '假' : '真實'}</span>
              <span className={`ap-method m-${c.method}`}>{c.method}</span>
              <div className="ap-main"><code>{c.path}</code><span>{new Date(c.at).toLocaleTimeString('zh-TW', { hour12: false })}</span></div>
              <span className={`ap-status ${c.status >= 400 ? 'err' : ''}`}>{c.status}</span>
            </div>
          ))
        )}
        {tab === 'recent' && !calls.length && <p className="ap-empty">尚無呼叫</p>}
      </div>
    </div>
  )
}
