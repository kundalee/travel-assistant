/* ═══════ 常數與範例資料（未連線 / 展示模式使用）═══════ */
import type { AdminCollections, AnnCat, Tour, ProductKind, Receivable, Role, SettlementCycle, Stats, TourStatus, Vital, Zone } from '../types/admin'

export const DEMO = { email: 'admin@example.com', pw: 'admin1234' }

export const IMG = {
  tokyo: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=400&q=70',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=70',
  hualien: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=400&q=70',
  bangkok: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=400&q=70',
  a1: 'https://randomuser.me/api/portraits/women/68.jpg',
  a2: 'https://randomuser.me/api/portraits/men/32.jpg',
  a3: 'https://randomuser.me/api/portraits/women/44.jpg',
  a4: 'https://randomuser.me/api/portraits/men/45.jpg',
  a5: 'https://randomuser.me/api/portraits/women/25.jpg',
}

export const PAYLABEL: Record<string, string> = { card: '信用卡', linepay: 'LINE Pay', mobilepay: '行動支付', cvs: '超商代碼', atm: 'ATM 轉帳', guide: '現場付款' }
export const ROLE_TW: Record<Role, string> = { member: '團員', guide: '領隊導遊', agent: '支援店家', admin: '管理員' }
export { STATUS_ALL } from '../../lib/orders'
export const TOUR_STATUS_TW: Record<TourStatus, string> = { preparing: '準備中', upcoming: '即將出發', ongoing: '進行中', closed: '已結束', cancelled: '已取消' }
export const HISTORY_AFTER_DAYS = 3 /* 結束日 +3 天後歸入歷史行程 */

export const CATS = ['生活用品', '養生素食', '農產蔬果', '海鮮水產', '奶蛋肉品', '其它優選商品']
export const PAYFLOW: Record<string, string> = { cash: '現金', epay: '電子支付' }
export const KIND_TW: Record<ProductKind, string> = { souvenir: '紀念商品', deal: '團購商品', boutique: '精品好物' }
export const KIND_KEY: Record<string, ProductKind> = { 紀念商品: 'souvenir', 團購商品: 'deal', 精品好物: 'boutique' }
export const ORDER_KINDS: [ProductKind | 'all', string][] = [['all', '全部'], ['souvenir', '紀念商品'], ['deal', '團購商品'], ['boutique', '精品好物']]

export const V_KINDS = ['紀念商品', '精品好物'] /* 商品分類 — 可複選（團購商品另由團購搶好康管理）*/
/* 結算週期 */
export const SETTLEMENT_TW: Record<SettlementCycle, string> = { per_tour: '每團結算', monthly: '每月結算' }

export const ANN_TYPES: Record<AnnCat, string[]> = { 每日公告: ['晨喚', '集合時間與地點', '行程概述'], 一般公告: ['注意事項', '旅行社公告'] }

function tour(id: number, code: string, name: string, destination: string, start_date: string, end_date: string, status: TourStatus, price: number, withGuide: boolean, currency = 'JPY'): Tour {
  return {
    id, code, name, description: null, destination, start_date, end_date, status, auto_status: true, status_changed_at: '2026-06-20T09:00:00Z', notes: null,
    min_size: 10, max_size: 30, price_per_person: price.toFixed(2), currency, owner_agent_id: 4,
    guides: withGuide ? [{ guide_id: 2, full_name: '王大明', is_lead: true }] : [], created_at: '2026-06-01T09:00:00Z',
  }
}

export const SAMPLE: AdminCollections = {
  /* 帳號：與後端 UserRead 相同格式 */
  users: [
    { id: 1, full_name: '系統管理員', email: 'admin@a.com', roles: ['admin'], phone: null, is_active: true, last_login_at: '2026-07-06T08:12:00Z', created_at: '2026-01-05T09:00:00Z' },
    { id: 2, full_name: '王大明', email: 'guide@a.com', roles: ['guide', 'member'], phone: '0912-345-678', is_active: true, last_login_at: '2026-07-05T21:40:00Z', created_at: '2026-01-05T09:00:00Z' },
    { id: 3, full_name: '林小美', email: 'trav1@a.com', roles: ['member'], phone: '0922-111-222', is_active: true, last_login_at: null, created_at: '2026-01-05T09:00:00Z' },
    { id: 4, full_name: '京都物產店', email: 'store@a.com', roles: ['agent'], phone: '0933-444-555', is_active: true, last_login_at: '2026-07-01T10:05:00Z', created_at: '2026-01-05T09:00:00Z' },
    { id: 5, full_name: '陳志豪', email: 'trav2@a.com', roles: ['member'], phone: '0955-666-777', is_active: true, last_login_at: null, created_at: '2026-01-05T09:00:00Z' },
    { id: 6, full_name: '黃雅婷', email: 'trav3@a.com', roles: ['member'], phone: '0966-888-999', is_active: false, last_login_at: null, created_at: '2026-01-05T09:00:00Z' },
  ],
  /* 行程來源：旅行社 CRM / 行程建立系統 API 同步（本系統不自行產生行程） */
  /* 行程：與後端 TourRead 相同格式（所屬旅行社 = 帳號 4、領隊 = 帳號 2） */
  tours: [
    tour(1, 'KYO-260630-1', '京都文化深度六日', '京都, 日本', '2026-06-30', '2026-07-05', 'ongoing', 68000, true),
    tour(2, 'TYO-260715-1', '日本東京五日遊', '東京, 日本', '2026-07-15', '2026-07-19', 'upcoming', 52000, true),
    tour(3, 'HUN-260505-1', '花蓮太魯閣三日遊', '花蓮, 台灣', '2026-05-05', '2026-05-07', 'closed', 12800, true, 'TWD'),
    tour(4, 'BKK-260820-1', '泰國曼谷四日遊', '曼谷, 泰國', '2026-08-20', '2026-08-23', 'preparing', 26800, false),
    tour(5, 'CTS-260210-1', '北海道賞雪五日', '北海道, 日本', '2026-02-10', '2026-02-14', 'closed', 59000, true),
    tour(6, 'BKK-260820-2', '泰國曼谷四日遊', '曼谷, 泰國', '2026-08-20', '2026-08-23', 'preparing', 26800, false),
  ],
  orders: [
    { id: 'o1', buyer_name: '林小美', product_name: '八橋餅禮盒', qty: 2, amount: 960, status: '已付款', method: 'card', payflow: 'epay', fulfillment: 'ship', logistics: '黑貓', kind: 'souvenir', cat: '其它優選商品', reconciled: false, created_at: '2026-07-02' },
    { id: 'o2', buyer_name: '陳志豪', product_name: '竹細工茶筒', qty: 1, amount: 1200, status: '未付款', method: 'cvs', payflow: '', fulfillment: 'pickup', pickup: '飯店', kind: 'souvenir', cat: '生活用品', reconciled: false, created_at: '2026-07-02' },
    { id: 'o3', buyer_name: '黃雅婷', product_name: '宇治抹茶精選組', qty: 2, amount: 2500, status: '已出貨', method: 'linepay', payflow: 'epay', fulfillment: 'ship', logistics: '便利商店_店到店', kind: 'deal', cat: '養生素食', reconciled: true, created_at: '2026-07-01' },
    { id: 'o4', buyer_name: '林小美', product_name: '京都西陣織絲巾', qty: 1, amount: 1680, status: '待出貨', method: 'card', fulfillment: 'ship', kind: 'boutique', cat: '生活用品', reconciled: false, created_at: '2026-07-03' },
    { id: 'o5', buyer_name: '陳志豪', product_name: '清酒一合瓶', qty: 1, amount: 720, status: '已付款', method: 'guide', payflow: 'cash', fulfillment: 'pickup', pickup: '機場', kind: 'souvenir', cat: '其它優選商品', reconciled: false, created_at: '2026-07-03' },
  ],
  bookings: [
    { id: 'b1', name: '林小美', tour_title: '日本東京五日遊', phone: '0922-111-222', status: 'pending', created_at: '2026-07-05' },
    { id: 'b2', name: '陳志豪', tour_title: '泰國曼谷四日遊', phone: '0955-666-777', status: 'pending', created_at: '2026-07-06' },
  ],
  reviews: [
    { id: 'r1', reviewer_name: '林小美', tour_title: '花蓮太魯閣三日遊', rating: 5, text: '太魯閣導覽很精彩，領隊很照顧長輩。' },
    { id: 'r2', reviewer_name: '陳志豪', tour_title: '京都文化深度六日', rating: 4, text: '整體很好，希望自由活動時間再多一點。' },
  ],
  announcements: [
    { id: 'an1', cat: '一般公告', type: '注意事項', headline: '颱風動態提醒', body: '旅行社持續關注西太平洋熱帶低壓，如影響回程航班將即時通知各團領隊與團員。', tour_title: '京都文化深度六日', target: '依團名', targetVal: '京都文化深度六日', mode: 'now', pubFrom: '2026/07/06', pubTo: '', published: true },
    { id: 'an2', cat: '每日公告', type: '集合時間與地點', headline: '今日集合 08:00 · 大廳', body: '08:00 於飯店一樓大廳集合，請攜帶護照影本與雨具。', tour_title: '京都文化深度六日', target: '依行程', targetVal: '京都文化深度六日', mode: 'now', pubFrom: '2026/07/03', pubTo: '', published: true },
    { id: 'an3', cat: '每日公告', type: '晨喚', headline: '明日 06:30 晨喚', body: 'Day 4 前往嵐山，請於 06:30 接聽晨喚電話，07:15 飯店大廳集合。', tour_title: '京都文化深度六日', target: '依團名', targetVal: '京都文化深度六日', mode: 'schedule', pubFrom: '2026/07/04', pubTo: '2026/07/05', published: false },
  ],
  campaigns: [
    { id: 'c1', channel: 'email', title: '京都限定 · 抹茶禮盒團購', published: true },
    { id: 'c2', channel: 'sms', title: '嵐山竹細工快閃', published: true },
  ],
  products: [
    { id: 'p1', name: '八橋餅禮盒', price_twd: 480, cost: 300, bonus_twd: 60, kind: 'souvenir', kinds: ['紀念商品'], cat: '其它優選商品', vendor_id: '1' },
    { id: 'p2', name: '宇治抹茶精選組', price_twd: 1250, cost: 780, bonus_twd: 150, kind: 'deal', kinds: ['精品好物'], cat: '養生素食', vendor_id: '2' },
    { id: 'p3', name: '京都西陣織絲巾', price_twd: 1680, cost: 1050, bonus_twd: 200, kind: 'boutique', kinds: ['精品好物'], cat: '生活用品', vendor_id: '1' },
    { id: 'p4', name: '宇治抹茶粉', price_twd: 650, bonus_twd: 78, cost: 403, kinds: ['紀念商品'], vendor_id: '3', kind: 'souvenir', cat: '養生素食' },
    { id: 'p5', name: '竹細工茶筒', price_twd: 1200, bonus_twd: 144, cost: 744, kinds: ['紀念商品'], vendor_id: '1', kind: 'souvenir', cat: '生活用品' },
    { id: 'p6', name: '京漬物三味', price_twd: 540, bonus_twd: 65, cost: 335, kinds: ['紀念商品'], vendor_id: '1', kind: 'souvenir', cat: '農產蔬果' },
    { id: 'p7', name: '北海道海鮮干貝', price_twd: 980, bonus_twd: 118, cost: 608, kinds: ['紀念商品'], vendor_id: '3', kind: 'souvenir', cat: '海鮮水產' },
    { id: 'p8', name: '養生黑糖薑茶', price_twd: 360, bonus_twd: 43, cost: 223, kinds: ['紀念商品'], vendor_id: '1', kind: 'souvenir', cat: '養生素食' },
    { id: 'p9', name: '十勝鮮乳酪', price_twd: 420, bonus_twd: 50, cost: 260, kinds: ['紀念商品'], vendor_id: '1', kind: 'souvenir', cat: '奶蛋肉品' },
    { id: 'p10', name: '京友禪手帕', price_twd: 320, bonus_twd: 38, cost: 198, kinds: ['紀念商品'], vendor_id: '3', kind: 'souvenir', cat: '生活用品' },
    { id: 'p11', name: '信州蘋果乾', price_twd: 280, bonus_twd: 34, cost: 174, kinds: ['紀念商品'], vendor_id: '2', kind: 'souvenir', cat: '農產蔬果' },
    { id: 'p12', name: '清酒一合瓶', price_twd: 720, bonus_twd: 86, cost: 446, kinds: ['紀念商品'], vendor_id: '1', kind: 'souvenir', cat: '其它優選商品' },
  ],

  /* 以下目前僅有範例資料（尚未對應雲端資料表） */

  /* 旅遊地點（名稱 / Google 座標 / 概述）— 可掛紀念商品 */
  places: [
    { id: 'pl1', name: '清水寺 · 二年坂', lat: 34.994856, lng: 135.785046, desc: '京都代表性古寺，二年坂石坂道散策，適合安排紀念品採買。', souvenirs: [{ id: 'p1', pid: 'p1', name: '八橋餅禮盒', price: 480 }, { id: 'p4', pid: 'p4', name: '宇治抹茶粉', price: 650 }] },
    { id: 'pl2', name: '嵐山 · 竹林小徑', lat: 35.017438, lng: 135.671887, desc: '竹林步道與渡月橋，秋季楓紅、竹細工工藝品聚集。', souvenirs: [{ id: 'p5', pid: 'p5', name: '竹細工茶筒', price: 1200 }] },
    { id: 'pl3', name: '祇園 · 花見小路', lat: 35.003611, lng: 135.775, desc: '傳統花街，京漬物、和風扇與清酒名店林立。', souvenirs: [] },
    { id: 'pl4', name: '淺草寺 · 雷門', lat: 35.714765, lng: 139.796655, desc: '東京最古老寺廟，仲見世通商店街紀念品豐富。', souvenirs: [] },
  ],
  /* 支援店家：與後端 ShopRead 相同格式 */
  shops: [
    { id: 1, name: '京都物產株式會社', contact_name: '山田太郎', phone: '+81-75-123-4567', email: 'info@kyoto-bussan.jp', address: '東山區清水 2-1', city: '京都', country: 'JP', agency_rate: '0.1500', settlement_cycle: 'monthly', is_active: true, place_ids: [], created_at: '2026-01-10T09:00:00Z' },
    { id: 2, name: '宇治茶園商事', contact_name: '鈴木花子', phone: '+81-774-88-1234', email: null, address: '宇治市宇治蓮華 5', city: '宇治', country: 'JP', agency_rate: '0.1200', settlement_cycle: 'per_tour', is_active: true, place_ids: [], created_at: '2026-02-03T09:00:00Z' },
    { id: 3, name: '北海道海產直送', contact_name: '佐藤健', phone: '+81-11-222-3333', email: null, address: '中央區', city: '札幌', country: 'JP', agency_rate: '0.1000', settlement_cycle: 'monthly', is_active: false, place_ids: [], created_at: '2026-03-15T09:00:00Z' },
  ],
  monthly: [
    { month: '2026/07', agency: '範例旅行社', amount: 842000, sent: false },
    { month: '2026/06', agency: '範例旅行社', amount: 915400, sent: true },
    { month: '2026/05', agency: '範例旅行社', amount: 733200, sent: true },
  ],
  trackingGroups: [
    { id: 'tg1', tour: '京都文化深度六日', city: '京都', continent: '亞洲', dates: '2026/06/30 - 07/05', members: 24, alert: 0, guide: '王大明', guidePhone: '0912-345-678', lat: 34.994856, lng: 135.785046, spot: '清水寺 · 二年坂', updated: '3 分鐘前' },
    { id: 'tg2', tour: '日本東京五日遊', city: '東京', continent: '亞洲', dates: '2026/07/15 - 07/19', members: 22, alert: 0, guide: '王大明', guidePhone: '0912-345-678', lat: 35.714765, lng: 139.796655, spot: '淺草寺 · 雷門', updated: '12 分鐘前' },
  ],
}

export const STATS: Stats = {
  members: [
    { tour: '京都文化深度六日', n: 24, guide: '王大明' },
    { tour: '日本東京五日遊', n: 22, guide: '王大明' },
    { tour: '泰國曼谷四日遊', n: 18, guide: '—' },
  ],
  rankSouvenir: [{ n: '八橋餅禮盒', v: 128 }, { n: '宇治抹茶粉', v: 96 }, { n: '竹細工茶筒', v: 54 }, { n: '京漬物三味', v: 41 }],
  rankDeal: [{ n: '宇治抹茶精選組', v: 212 }, { n: '京都西陣織絲巾', v: 140 }, { n: '清水燒茶杯對組', v: 88 }],
  rankTour: [{ n: '京都文化深度六日', v: 24 }, { n: '日本東京五日遊', v: 22 }, { n: '泰國曼谷四日遊', v: 18 }],
  rankBoutique: [{ n: '京都西陣織絲巾', v: 64 }, { n: '職人手作和菓子', v: 47 }],
  perf: [
    { who: '王大明', role: '旅遊團領隊', kind: '紀念商品', shipped: 86, amount: 64800, bonus: 8240 },
    { who: '黃團長', role: '團購團長', kind: '團購商品', shipped: 132, amount: 158400, bonus: 15840 },
  ],
}

export const VITALS: Vital[] = [
  { name: '林小美', temp: 36.6, bp: '118/76', ok: true },
  { name: '陳志豪', temp: 37.8, bp: '132/85', ok: false },
  { name: '黃雅婷', temp: 36.4, bp: '110/70', ok: true },
]
export const ZONES: Zone[] = [
  { name: '同疊旅團', note: '清水寺 09:20-10:05 · 2 團重疊', level: 'warn' },
  { name: '安全旅團', note: '嵐山 · 無警戒區域重疊', level: 'ok' },
]
export const RECEIVABLE: Receivable[] = [
  { party: '京都物產店', type: '應付', amount: 64800, due: '2026/07/20', done: false },
  { party: '範例旅行社', type: '應收', amount: 158400, due: '2026/07/15', done: true },
  { party: '黑貓宅急便', type: '應付', amount: 12400, due: '2026/07/25', done: false },
]

/* 行程的報名團員（依行程 id；付款狀態依序輪替） */
export const BOOKING_SEED: Record<number, string[]> = {
  1: ['林小美', '陳志豪', '黃雅婷', '張家維'],
  2: ['鄭凱文', '許美玲'],
  4: ['周欣怡'],
}
