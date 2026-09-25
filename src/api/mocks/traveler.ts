import type { PayMethod, TravelerData, TravelerProfile } from '../types/traveler'

export const IMG = {
  tokyo: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80',
  bangkok: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80',
  hualien: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=800&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  hokkaido: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=800&q=80',
  seoul: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
  guideM: 'https://randomuser.me/api/portraits/men/32.jpg',
  guideF: 'https://randomuser.me/api/portraits/women/44.jpg',
  me: 'https://randomuser.me/api/portraits/women/32.jpg',
  member: 'https://randomuser.me/api/portraits/women/68.jpg',
}

export const EMPTY_PROFILE: TravelerProfile = { name: '', email: '', phone: '', birth: '', passport: '', expiry: '', emName: '', emRel: '', emPhone: '' }

/* 付款方式：instant = 線上即時付款；deferred = 取得繳費資訊；onsite = 現場付給領隊 */
export const PAY_META: Record<PayMethod, { label: string; kind: 'instant' | 'deferred' | 'onsite' }> = {
  card: { label: '信用卡', kind: 'instant' },
  linepay: { label: 'LINE Pay', kind: 'instant' },
  mobilepay: { label: 'Apple / Google Pay', kind: 'instant' },
  cvs: { label: '超商代碼繳費', kind: 'deferred' },
  atm: { label: 'ATM 虛擬帳號', kind: 'deferred' },
  guide: { label: '現場付款給領隊', kind: 'onsite' },
}

/* 當地幣別參考（per = 每 1 TWD 約當地幣別，僅為示意匯率） */
export const CCY: Record<string, { code: string; sym: string; per: number }> = {
  日本: { code: 'JPY', sym: '¥', per: 4.7 }, 韓國: { code: 'KRW', sym: '₩', per: 42 }, 泰國: { code: 'THB', sym: '฿', per: 1.12 },
  中國: { code: 'CNY', sym: '¥', per: 0.23 }, 香港: { code: 'HKD', sym: 'HK$', per: 0.25 }, 美國: { code: 'USD', sym: '$', per: 0.031 },
  越南: { code: 'VND', sym: '₫', per: 815 }, 新加坡: { code: 'SGD', sym: 'S$', per: 0.042 }, 馬來西亞: { code: 'MYR', sym: 'RM', per: 0.147 },
}

const yes = (text: string) => ({ included: true, text })
const no = (text: string) => ({ included: false, text })

export const SAMPLE: TravelerData = {
  catalog: [
    { id: 't1', title: '日本東京五日遊', dest: '東京, 日本', region: '日本', price: 42900, img: IMG.tokyo, tags: ['熱門', '城市', '美食'], dates: '2026/07/15 - 07/19',
      highlights: ['淺草雷門與晴空塔', 'teamLab 無界數位藝術', '築地市場美食巡禮', '箱根溫泉一泊'],
      itin: [['Day 1', '桃園 ✈ 成田，淺草寺、仲見世通'], ['Day 2', '晴空塔、上野公園、阿美橫町'], ['Day 3', '箱根一日遊、蘆之湖遊船、溫泉'], ['Day 4', 'teamLab、台場、自由購物'], ['Day 5', '成田 ✈ 桃園，賦歸']],
      incl: [yes('來回機票與稅金'), yes('4 晚住宿（含 1 晚溫泉）'), yes('專業中文領隊'), no('午晚餐部分自理'), no('個人旅遊保險')], guide: '王大明' },
    { id: 't2', title: '泰國曼谷四日遊', dest: '曼谷, 泰國', region: '東南亞', price: 28500, img: IMG.bangkok, tags: ['推薦', '購物', '寺廟'], dates: '2026/08/20 - 08/23',
      highlights: ['大皇宮與玉佛寺', '昭披耶河遊船晚宴', '恰圖恰週末市集', '按摩 SPA 體驗'],
      itin: [['Day 1', '桃園 ✈ 曼谷，河濱夜市'], ['Day 2', '大皇宮、臥佛寺、鄭王廟'], ['Day 3', '水上市場、市集購物'], ['Day 4', 'SPA、曼谷 ✈ 桃園']],
      incl: [yes('來回機票與稅金'), yes('3 晚五星住宿'), yes('中文領隊與司機'), no('小費 NT$1,200'), no('自費行程')], guide: '李美麗' },
    { id: 't3', title: '京都文化深度六日', dest: '京都, 日本', region: '日本', price: 51200, img: IMG.kyoto, tags: ['促銷', '文化', '古蹟'], dates: '2026/09/05 - 09/10',
      highlights: ['清水寺與二年坂', '嵐山竹林與渡月橋', '伏見稻荷千本鳥居', '和服體驗'],
      itin: [['Day 1', '桃園 ✈ 關西，祇園'], ['Day 2', '清水寺、八坂神社'], ['Day 3', '嵐山、金閣寺'], ['Day 4', '伏見稻荷、宇治'], ['Day 5', '奈良公園、大阪'], ['Day 6', '關西 ✈ 桃園']],
      incl: [yes('來回機票與稅金'), yes('5 晚住宿'), yes('和服體驗一次'), no('部分餐食'), no('旅遊保險')], guide: '王大明' },
    { id: 't4', title: '北海道賞雪五日', dest: '札幌, 日本', region: '日本', price: 48900, img: IMG.hokkaido, tags: ['季節限定', '溫泉', '雪景'], dates: '2026/12/18 - 12/22',
      highlights: ['小樽運河雪景', '登別地獄谷溫泉', '札幌雪祭', '螃蟹吃到飽'],
      itin: [['Day 1', '桃園 ✈ 新千歲'], ['Day 2', '小樽、運河'], ['Day 3', '登別溫泉'], ['Day 4', '札幌市區、狸小路'], ['Day 5', '新千歲 ✈ 桃園']],
      incl: [yes('來回機票'), yes('溫泉住宿'), yes('領隊'), no('滑雪裝備'), no('保險')], guide: '李美麗' },
    { id: 't5', title: '首爾樂遊四日', dest: '首爾, 韓國', region: '東北亞', price: 26800, img: IMG.seoul, tags: ['親子', '購物', '韓流'], dates: '2026/07/28 - 07/31',
      highlights: ['景福宮韓服體驗', '南山塔愛情鎖', '明洞購物', '汗蒸幕體驗'],
      itin: [['Day 1', '桃園 ✈ 仁川，明洞'], ['Day 2', '景福宮、北村'], ['Day 3', '南山塔、樂天世界'], ['Day 4', '仁川 ✈ 桃園']],
      incl: [yes('來回機票'), yes('3 晚住宿'), yes('領隊'), no('部分餐食'), no('保險')], guide: '王大明' },
  ],

  upcoming: [
    { tourId: 't1', title: '日本東京五日遊', dest: '東京, 日本', img: IMG.tokyo, dates: '2026/07/15 - 07/19',
      meetTime: '2026/07/15 上午 06:30', meetPlace: '桃園機場第一航廈', guide: '王大明', guideRole: '領隊導遊', phone: '0912-345-678', guideImg: IMG.guideM, qr: 'TA-BK-20260715-T1-0001',
      video: 'https://www.youtube.com/embed/1La4QzGeaaQ',
      notes: ['出發前請確認護照效期 6 個月以上', '託運行李限重 23kg，隨身行李限重 7kg', '建議攜帶輕便雨具與個人常備藥品', '當地電壓 100V，插座為雙平腳，請自備變壓器', '行程中請隨身攜帶領隊聯絡卡'],
      flight: { dep: 'TPE 桃園 06:30 → NRT 成田 10:45', depAir: '長榮航空 BR198', ret: 'NRT 成田 18:20 → TPE 桃園 21:05', retAir: '長榮航空 BR197', pnr: 'TA-EVA-7X2K9', seat: '團體劃位，機場統一發放登機證' } },
    { tourId: 't2', title: '泰國曼谷四日遊', dest: '曼谷, 泰國', img: IMG.bangkok, dates: '2026/08/20 - 08/23',
      meetTime: '2026/08/20 上午 07:00', meetPlace: '桃園機場第二航廈', guide: '李美麗', guideRole: '領隊導遊', phone: '0933-456-789', guideImg: IMG.guideF, qr: 'TA-BK-20260820-T2-0002',
      video: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      notes: ['泰國落地簽或電子簽證，請提前備妥', '當地氣候炎熱，請攜帶防曬與薄外套', '小費文化普遍，建議備妥零錢', '飲用水請購買瓶裝水'],
      flight: { dep: 'TPE 桃園 07:00 → BKK 素萬那普 09:50', depAir: '泰國航空 TG635', ret: 'BKK 素萬那普 20:35 → TPE 桃園 01:05+1', retAir: '泰國航空 TG634', pnr: 'TA-THAI-3M8P2', seat: '團體劃位，機場統一發放登機證' } },
  ],
  ongoing: [
    { tourId: 't3', title: '京都文化深度六日', dest: '京都, 日本', img: IMG.kyoto, dates: '2026/06/30 - 07/05',
      guide: '王大明', guideRole: '領隊導遊', phone: '0912-345-678', guideImg: IMG.guideM, chatKey: 'group1', day: 'Day 3 / 6',
      locations: [
        { name: '清水寺 · 二年坂', icon: 'building-arch', souvenirs: [
          { id: 's1', name: '八橋餅禮盒', price: 480, emo: '🍡' }, { id: 's2', name: '宇治抹茶粉', price: 650, emo: '🍵' }, { id: 's3', name: '京友禪手帕', price: 320, emo: '🧣' }] },
        { name: '嵐山 · 竹林', icon: 'tree', souvenirs: [
          { id: 's4', name: '竹細工茶筒', price: 1200, emo: '🎋' }, { id: 's5', name: '嵐山限定和菓子', price: 560, emo: '🍡' }, { id: 's6', name: '湯豆腐調味組', price: 420, emo: '🥢' }] },
        { name: '祇園 · 花見小路', icon: 'map-pin', souvenirs: [
          { id: 's7', name: '舞妓和風扇', price: 380, emo: '🪭' }, { id: 's8', name: '京漬物三味', price: 540, emo: '🥬' }, { id: 's9', name: '清酒一合瓶', price: 720, emo: '🍶' }] },
      ],
      orders: [
        { id: 'o1', product: '八橋餅禮盒', qty: 2, amount: 960, status: '已付款' },
        { id: 'o2', product: '宇治抹茶粉', qty: 1, amount: 650, status: '已出貨' },
        { id: 'o3', product: '竹細工茶筒', qty: 1, amount: 1200, status: '未付款' },
        { id: 'o4', product: '京漬物三味', qty: 3, amount: 1620, status: '待出貨' },
      ] },
  ],
  completed: [
    { tourId: 't6', title: '花蓮太魯閣三日遊', dest: '花蓮, 台灣', img: IMG.hualien, dates: '2026/05/05 - 05/07', guide: '李美麗', rating: 4.8, reviewed: false, memories: 0 },
    { tourId: 't7', title: '首爾樂遊四日', dest: '首爾, 韓國', img: IMG.seoul, dates: '2026/03/12 - 03/15', guide: '王大明', rating: 5, reviewed: true, memories: 8 },
  ],

  notis: [
    { id: 'n1', type: 'depart', title: '出團提醒：日本東京五日遊', time: '10 分鐘前', read: false, text: '您的東京五日遊將於 3 天後出發，請檢查護照效期並備妥物品。集合：07/15 06:30，桃園機場第一航廈。' },
    { id: 'n2', type: 'msg', title: '導遊王大明發送了新訊息', time: '1 小時前', read: false, text: '大家好！我是這次東京行的領隊王大明，出發前有任何問題都可以在聊天室詢問喔！' },
    { id: 'n3', type: 'pay', title: '付款確認：泰國曼谷四日遊', time: '昨天', read: true, text: '我們已收到您的報名費用 NT$28,500，報名成功，期待與您同行！' },
    { id: 'n4', type: 'weather', title: '天氣預報更新', time: '昨天', read: true, text: '東京下週氣溫約 24-30 度，午後偶陣雨，建議攜帶輕便雨具與防曬。' },
    { id: 'n5', type: 'photo', title: '新相片上傳：花蓮太魯閣三日遊', time: '2026/05/08', read: true, text: '導遊已上傳 15 張行程照片，快來相簿看看您的精彩瞬間！' },
    { id: 'n6', type: 'review', title: '邀請您撰寫評價', time: '2026/05/09', read: true, text: '花蓮太魯閣三日遊已結束，您的回饋能幫助更多旅客，歡迎給予評價。' },
  ],
  chats: {
    group1: { name: '東京五日遊', msgs: [
      { self: false, guide: true, name: '王大明 (領隊)', av: IMG.guideM, text: '大家好！我是這次東京行的領隊王大明，出發前有任何問題都可以在這裡詢問喔！', time: '10:30' },
      { self: true, name: '我', av: IMG.me, text: '領隊您好，請問集合地點在第一航廈哪個位置呢？', time: '10:35' },
      { self: false, guide: true, name: '王大明 (領隊)', av: IMG.guideM, text: '我們在第一航廈 3 樓長榮航空團體櫃檯前集合，我會手持「TravelAssistant」的牌子等候大家。', time: '10:36' },
      { self: false, name: '林小美', av: IMG.member, text: '請問需要提前多久到機場呢？', time: '10:38' },
      { self: false, guide: true, name: '王大明 (領隊)', av: IMG.guideM, text: '建議提前 2.5 小時抵達，方便辦理團體報到與行李託運 🧳', time: '10:40' },
    ] },
    group2: { name: '曼谷四日遊', msgs: [
      { self: false, guide: true, name: '李美麗 (領隊)', av: IMG.guideF, text: '曼谷團的團員們好～天氣炎熱，記得帶防曬和薄外套！', time: '昨天 14:20' },
    ] },
    support: { name: '客服中心', msgs: [
      { self: false, name: 'TravelAssistant 客服', text: '您好，這裡是旅遊 AI 助理客服，有任何行程或訂單問題都可以詢問我們 😊', time: '週一 09:00' },
    ] },
  },
  album: [
    { id: 'ph1', src: IMG.hualien, cap: '太魯閣國家公園 · 2026/05/06', up: '導遊 李美麗', by: 'guide' },
    { id: 'ph2', src: IMG.kyoto, cap: '清水寺參道', up: '導遊 李美麗', by: 'guide' },
    { id: 'ph3', src: IMG.tokyo, cap: '團體合照', up: '我', by: 'mine' },
    { id: 'ph4', src: IMG.hokkaido, cap: '山谷雲海', up: '導遊 李美麗', by: 'guide' },
    { id: 'ph5', src: IMG.seoul, cap: '午餐時光', up: '我', by: 'mine' },
    { id: 'ph6', src: IMG.bangkok, cap: '河濱夜景', up: '團員 林小美', by: 'guide' },
  ],

  notices: [
    { type: '每日公告', kind: '晨喚', title: '明日 06:30 晨喚', body: 'Day 4 前往嵐山，請於 06:30 接聽晨喚電話，07:15 飯店大廳集合。', by: '王大明 領隊', time: '今天 21:10' },
    { type: '每日公告', kind: '集合時間與地點', title: '今日集合 08:00 · 大廳', body: '08:00 於飯店一樓大廳集合，攜帶護照影本與雨具。', by: '王大明 領隊', time: '今天 07:30' },
    { type: '每日公告', kind: '行程概述', title: 'Day 3 · 祇園與花見小路', body: '上午清水寺、二年坂散策，午餐湯豆腐，下午祇園自由活動。', by: '王大明 領隊', time: '今天 07:35' },
    { type: '一般公告', kind: '旅行社公告', title: '颱風動態提醒', body: '旅行社持續關注熱帶低壓，如影響回程航班將即時通知各團。', by: '範例旅行社', time: '昨天' },
    { type: '一般公告', kind: '注意事項', title: '旅遊平安保險已投保', body: '本團已投保旅遊平安險與不便險，理賠說明請洽客服。', by: '範例旅行社', time: '2 天前' },
  ],
  boutique: [
    { name: '京都西陣織絲巾', price: 1680, emo: '🧣', desc: '職人手織，領隊嚴選', url: 'https://shop.example.com/items/nishijin-scarf' },
    { name: '宇治抹茶精選組', price: 1250, emo: '🍵', desc: '宇治老舖直送', url: 'https://shop.example.com/items/uji-matcha-set' },
    { name: '清水燒茶杯對組', price: 2200, emo: '🍶', desc: '回台後宅配到府', url: 'https://shop.example.com/items/kiyomizu-cups' },
  ],
  groupbuy: [
    { id: 'g1', name: '宇治抹茶精選組', emo: '🍵', price: 1125, orig: 1250, desc: '團購 9 折 · 滿三組免運' },
    { id: 'g2', name: '竹細工茶筒', emo: '🎋', price: 1020, orig: 1200, desc: '限量 30 組' },
    { id: 'g3', name: '京都西陣織絲巾', emo: '🧣', price: 1490, orig: 1680, desc: '集結地點取貨' },
    { id: 'g4', name: '職人手作和菓子', emo: '🍡', price: 790, orig: 880, desc: '每日限量' },
  ],
  historyOrders: [
    { id: 'h1', product: '八橋餅禮盒', tour: '京都文化深度六日', date: '2026/07/02', amount: 960, status: '已付款' },
    { id: 'h2', product: '竹細工茶筒', tour: '京都文化深度六日', date: '2026/07/02', amount: 1200, status: '未付款' },
    { id: 'h3', product: '京漬物三味', tour: '京都文化深度六日', date: '2026/07/03', amount: 1620, status: '待出貨' },
    { id: 'h4', product: '太魯閣紀念磁鐵', tour: '花蓮太魯閣三日遊', date: '2026/05/06', amount: 360, status: '已出貨' },
    { id: 'h5', product: '北海道限定巧克力', tour: '北海道賞雪五日', date: '2026/02/12', amount: 980, status: '已取消' },
  ],
  historyTours: [
    { title: '花蓮太魯閣三日遊', dates: '2026/05/05 - 05/07', img: IMG.hualien, memories: 12 },
    { title: '北海道賞雪五日', dates: '2026/02/10 - 02/14', img: IMG.hokkaido, memories: 26 },
    { title: '首爾樂遊四日', dates: '2026/03/12 - 03/15', img: IMG.seoul, memories: 8 },
  ],
  trace: [
    { t: '08:10', place: '飯店大廳（集合）' }, { t: '09:25', place: '清水寺 · 二年坂' },
    { t: '12:30', place: '順正 湯豆腐（午餐）' }, { t: '14:50', place: '祇園 · 花見小路' },
  ],
  contacts: [
    { name: '同團團員', n: 24, note: '京都文化深度六日' },
    { name: '鄰近旅團（同疊）', n: 2, note: '清水寺 09:20-10:05' },
  ],
}
