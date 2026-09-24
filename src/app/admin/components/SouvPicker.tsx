import { useState } from 'react'
import { CATS } from '../../../api/mocks/admin'
import { useAdmin } from '../store'
import type { Souvenir } from '../../../api/types/admin'
import { fmt, includesQ, uid } from '../utils'
import { Chips, Empty, Hl, Icon, Modal, SearchBox } from '../../../components'

interface Props {
  title: string
  initial: string[] /* 已串聯的 product id */
  onApply: (chosen: Souvenir[]) => void
  onClose: () => void
}

/* 紀念商品挑選器：連結紀念商品資料庫（全文檢索 + 分類 + 複選） */
export default function SouvPicker({ title, initial, onApply, onClose }: Props) {
  const { data, create } = useAdmin()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('全部')
  const [sel, setSel] = useState<Set<string>>(() => new Set(initial))
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const souvenirs = data.products.filter((p) => p.kind === 'souvenir')
  const list = souvenirs.filter((p) =>
    (cat === '全部' || (p.cat || '其它優選商品') === cat) && includesQ([p.name, p.cat, String(p.price_twd)], q))

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  /* 資料庫沒有 → 新增一筆紀念商品到商品庫，並自動勾選 */
  function addProduct() {
    const name = newName.trim(); if (!name) return
    const price = Number(newPrice) || 0
    const id = uid('p')
    create('products', {
      id, name, price_twd: price, bonus_twd: Math.round(price * 0.12), kind: 'souvenir', kinds: ['紀念商品'],
      cat: CATS.includes(cat) ? cat : '其它優選商品',
    }, '已新增至紀念商品資料庫', 'database-plus')
    setSel((s) => new Set(s).add(id))
    setAdding(false); setNewName(''); setNewPrice('')
  }

  function apply() {
    const chosen = souvenirs.filter((p) => sel.has(p.id)).map((p) => ({ id: p.id, pid: p.id, name: p.name, price: Number(p.price_twd) }))
    onApply(chosen)
  }

  return (
    <Modal onClose={onClose} title="挑選紀念商品" sub={title || '從紀念商品資料庫選擇（可複選）'}>
      <div className="filt-row"><SearchBox value={q} onChange={setQ} placeholder="全文檢索：商品名稱 / 分類 / 價格" /></div>
      <Chips className="cat-chips" value={cat} onChange={setCat} items={['全部', ...CATS].map((c) => [c, c])} />
      <div className="data-note"><Icon name="list-search" />資料庫符合 {list.length} 項 · 已選 {sel.size} 項</div>

      <div style={{ maxHeight: '42vh', overflowY: 'auto', marginBottom: '0.9rem' }}>
        {list.length ? list.map((p) => {
          const on = sel.has(p.id)
          return (
            <div key={p.id} className={`lrow pick-row ${on ? 'on' : ''}`} onClick={() => toggle(p.id)}>
              <div className="pick-box">{on && <Icon name="check" />}</div>
              <div className="lmain">
                <div className="lname"><Hl text={p.name} q={q} /></div>
                <div className="lsub">NT$ {fmt(p.price_twd)}</div>
                <div className="lsub2"><Hl text={p.cat || '其它優選商品'} q={q} /></div>
              </div>
            </div>
          )
        }) : <Empty text="資料庫查無符合的紀念商品" />}
      </div>

      {adding && (
        <div className="filt-row">
          <input style={{ flex: 2 }} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新紀念商品名稱" autoFocus />
          <input style={{ flex: 1 }} type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="價格 NT$" />
          <button className="btn btn-primary btn-sm" onClick={addProduct}><Icon name="plus" />新增</button>
        </div>
      )}
      <div className="action-2">
        <button className="btn btn-ghost" onClick={() => setAdding(!adding)}><Icon name="plus" />資料庫沒有？新增商品</button>
        <button className="btn btn-primary" onClick={apply}><Icon name="check" />加入所選（{sel.size}）</button>
      </div>
    </Modal>
  )
}
