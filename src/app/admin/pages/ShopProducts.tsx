import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AsyncButton, confirmDialog, Empty, FileDrop, Hl, Icon, Modal, PageHead, QueryState, SearchBox, TableEmpty, toast, useBusy } from '../../../components'
import type { ImportJob, Shop, ShopProduct } from '../../../api/types/admin'
import { DataNote } from '../components/DataNote'
import { ProductModal } from '../components/ProductParts'
import { downloadProductTemplate, useAdminData, useProductActions, useShopProducts } from '../queries'
import { commission, errMsg, includesQ, money, ratePct, stockText } from '../utils'

/* 匯入：下載範本 → 填寫 → 上傳；全部正確才寫入，否則列出每一列的問題 */
function ImportModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { importFile } = useProductActions()
  const [file, setFile] = useState<File | null>(null)
  const [job, setJob] = useState<ImportJob | null>(null)
  const [downloading, run] = useBusy()

  const template = (format: 'csv' | 'xlsx') => run(() => downloadProductTemplate(shop.id, format).catch((e) => toast('範本下載失敗：' + errMsg(e), 'alert-circle')))

  async function submit() {
    if (!file) return toast('請先選擇檔案', 'alert-circle')
    const result = await importFile.mutateAsync({ shopId: shop.id, file })
    setJob(result)
    if (result.status !== 'failed') {
      toast(`「${result.file_name}」匯入完成`, 'file-check')
      onClose()
    }
  }

  return (
    <Modal onClose={onClose} title="匯入商品" sub={shop.name}>
      <div className="section-title sm"><Icon name="download" />1. 下載範本</div>
      <p className="hint" style={{ marginBottom: '0.6rem' }}>欄位：sku、name、price、currency 必填；stock 留空 = 不限；default_commission_share 為 0–1（例 0.3 = 30%）；日期格式 YYYY-MM-DD。</p>
      <div className="action-2" style={{ marginTop: 0 }}>
        <button className="btn btn-ghost" disabled={downloading} onClick={() => template('csv')}><Icon name="file-text" />CSV 範本</button>
        <button className="btn btn-ghost" disabled={downloading} onClick={() => template('xlsx')}><Icon name="table" />Excel 範本</button>
      </div>

      <div className="section-title sm" style={{ marginTop: '1.1rem' }}><Icon name="upload" />2. 上傳填好的檔案</div>
      <FileDrop accept=".csv,.xlsx" onFiles={([f]) => { setFile(f); setJob(null) }}>
        <Icon name="file-upload" />
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{file ? <><b>{file.name}</b>（點擊或拖曳以更換）</> : '拖曳 CSV 或 Excel 檔到這裡，或點擊選擇'}</p>
      </FileDrop>

      {job?.status === 'failed' && (
        <div className="alert err show" style={{ marginTop: '0.9rem', display: 'block' }}>
          <b>匯入失敗，沒有寫入任何商品。</b>請修正以下問題後重新上傳：
          <ul style={{ margin: '6px 0 0 1.1rem', maxHeight: 220, overflowY: 'auto' }}>
            {(job.error_report ?? []).map((e, i) => <li key={i}>第 {e.row} 列{e.field ? ` · ${e.field}` : ''}：{e.message}</li>)}
          </ul>
        </div>
      )}
      <AsyncButton className="btn btn-primary btn-block btn-lg" style={{ marginTop: '1rem' }} disabled={!file} onClick={submit}><Icon name="upload" />匯入</AsyncButton>
    </Modal>
  )
}

/* 店家的商品：/admin/shops/:shopId/products */
export default function ShopProducts() {
  const shopId = Number(useParams().shopId)
  const shops = useAdminData('shops')
  const products = useShopProducts(shopId)
  return (
    <QueryState queries={[...shops.queries, products]}>{() => {
      const shop = shops.data!.shops.find((s) => s.id === shopId)
      return shop ? <ShopProductsView shop={shop} products={products.data!} /> : <Navigate to="/admin/shops" replace />
    }}</QueryState>
  )
}

type SaleFilter = 'all' | 'on' | 'off'

function ShopProductsView({ shop, products }: { shop: Shop; products: ShopProduct[] }) {
  const { remove } = useProductActions()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('全部')
  const [sale, setSale] = useState<SaleFilter>('all')
  const [editing, setEditing] = useState<ShopProduct | 'new' | null>(null)
  const [importing, setImporting] = useState(false)

  const categories = [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))].sort()
  const list = products.filter((p) =>
    (category === '全部' || p.category === category) &&
    (sale === 'all' || p.is_on_sale === (sale === 'on')) &&
    includesQ([p.sku, p.name, p.category, p.description], q))

  function del(p: ShopProduct) {
    return confirmDialog({
      title: '刪除商品？', message: `「${p.name}」（${p.sku}）將被永久刪除。`, confirmLabel: '刪除', danger: true,
      onConfirm: async () => { await remove.mutateAsync(p.id); toast('已刪除商品', 'trash') },
    })
  }

  return (
    <div className="pad">
      <PageHead icon="package" title={`商品資料管理_${shop.name}`} back="/admin/shops">
        <button className="btn btn-ghost" onClick={() => setImporting(true)}><Icon name="file-upload" />匯入</button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增商品</button>
      </PageHead>
      <div className="data-note"><Icon name="building-store" />此處商品皆屬於「{shop.name}」 · 店家抽成 {ratePct(shop.agency_rate)}</div>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="全文檢索：SKU / 商品名稱 / 分類 / 說明" />
        <select className="filt" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="全部">全部分類</option>{categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="filt" value={sale} onChange={(e) => setSale(e.target.value as SaleFilter)}>
          <option value="all">全部狀態</option><option value="on">上架中</option><option value="off">已下架</option>
        </select>
      </div>
      <DataNote group="admin.shopProducts" />
      <div className="card-wrap">
        <table className="dtable">
          <thead><tr>
            <th>商品</th><th style={{ width: 140 }}>售價</th><th style={{ width: 80 }}>庫存</th><th style={{ width: 150 }}>領隊佣金 / 件</th>
            <th style={{ width: 170 }}>販售期間</th><th style={{ width: 80 }}>狀態</th><th style={{ width: 80 }}>工具</th>
          </tr></thead>
          <tbody>
            {list.length ? list.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="t-title"><Hl text={p.name} q={q} /></div>
                  <div className="t-sub"><Hl text={p.sku} q={q} />{p.category && <> · <Hl text={p.category} q={q} /></>}</div>
                </td>
                <td>{money(p.price, p.currency)}</td>
                <td className={p.stock === 0 ? 't-sub' : undefined}>{stockText(p.stock)}</td>
                <td className="t-sub">{money(commission(p, shop), p.currency)}<br />分潤 {ratePct(p.default_commission_share)}</td>
                <td className="t-sub">{p.sale_start || p.sale_end ? `${p.sale_start ?? '…'} – ${p.sale_end ?? '…'}` : '不限'}</td>
                <td><span className={`st-badge ${p.is_on_sale ? 'on' : 'off'}`}>{p.is_on_sale ? '上架' : '下架'}</span></td>
                <td><div className="dt-acts">
                  <button onClick={() => setEditing(p)} title="修改"><Icon name="edit" /></button>
                  <button className="del" onClick={() => del(p)} title="刪除"><Icon name="trash" /></button>
                </div></td>
              </tr>
            )) : <TableEmpty cols={7} icon="package" text={products.length ? '查無符合的商品' : '尚無商品，點右上角新增或匯入'} />}
          </tbody>
        </table>
      </div>
      {!products.length && <Empty icon="file-upload" text="大量建立商品？" hint="點「匯入」下載範本，填好後一次上傳" />}

      {editing && (
        <ProductModal key={editing === 'new' ? 'new' : editing.id} shop={shop} product={editing === 'new' ? null : editing}
          categories={categories} onClose={() => setEditing(null)} />
      )}
      {importing && <ImportModal shop={shop} onClose={() => setImporting(false)} />}
    </div>
  )
}
