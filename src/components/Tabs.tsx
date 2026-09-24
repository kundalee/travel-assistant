/* 分頁切換（dtabs） */
export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: [K, string][]; value: K; onChange: (k: K) => void }) {
  return (
    <div className="dtabs scroll" style={{ marginBottom: '1rem' }}>
      {tabs.map(([k, label]) => (
        <button key={k} className={`dtab ${value === k ? 'active' : ''}`} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  )
}
