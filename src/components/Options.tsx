import { Icon } from './Icon'
/* 選項按鈕：單選 */
export function OptSingle({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="opt-grid">
      {options.map((o) => (
        <button key={o} type="button" className={`opt ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>
          <span className="mk">{value === o && <Icon name="check" />}</span>{o}
        </button>
      ))}
    </div>
  )
}

/* 選項按鈕：複選 */
export function OptMulti({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className="opt-grid">
      {options.map((o) => (
        <button key={o} type="button" className={`opt sq ${value.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>
          <span className="mk">{value.includes(o) && <Icon name="check" />}</span>{o}
        </button>
      ))}
    </div>
  )
}
