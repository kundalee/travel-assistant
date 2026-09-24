import type { GuideData } from '../types/guide'

export const IMG = {
  tokyo: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80',
  bangkok: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80',
  hualien: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=800&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  hokkaido: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=800&q=80',
  seoul: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
  guideM: 'https://randomuser.me/api/portraits/men/32.jpg',
  m1: 'https://randomuser.me/api/portraits/women/68.jpg',
  m2: 'https://randomuser.me/api/portraits/men/45.jpg',
  m3: 'https://randomuser.me/api/portraits/women/25.jpg',
  m4: 'https://randomuser.me/api/portraits/men/12.jpg',
}

export const DEMO_PROFILE = { name: '王大明', empId: 'G-2024-018', avatar: IMG.guideM }

export const SAMPLE: GuideData = {
  members: [
    { id: 'm1', name: '林小美', av: IMG.m1, email: 'may.lin@example.com', nick: '小美' },
    { id: 'm2', name: '陳志豪', av: IMG.m2, email: 'howie.chen@example.com', nick: '阿豪' },
    { id: 'm3', name: '黃雅婷', av: IMG.m3, email: 'yating.h@example.com', nick: '婷婷' },
    { id: 'm4', name: '張家維', av: IMG.m4, email: 'chiawei.chang@example.com', nick: '家維' },
  ],

  /* 各行程團員名冊（示範列出部分團員，其餘以樣板補足人數） */
  rosters: {
    t3: { tourTitle: '京都文化深度六日', batch: '20260630-1團', members: [
      { name: '林小美', email: 'may.lin@example.com', nick: '小美' },
      { name: '陳志豪', email: 'howie.chen@example.com', nick: '阿豪' },
      { name: '黃雅婷', email: 'yating.h@example.com', nick: '婷婷' },
      { name: '張家維', email: 'chiawei.chang@example.com', nick: '家維' },
      { name: '李承恩', email: 'ethan.lee@example.com', nick: '承恩' },
      { name: '王思穎', email: 'sara.wang@example.com', nick: '思穎' },
      { name: '吳柏翰', email: 'brian.wu@example.com', nick: '柏翰' },
      { name: '蔡雨潔', email: 'claire.tsai@example.com', nick: '雨潔' },
    ] },
    t1: { tourTitle: '日本東京五日遊', batch: '20260715-1團', members: [
      { name: '鄭凱文', email: 'kevin.cheng@example.com', nick: '凱文' },
      { name: '許美玲', email: 'meiling.hsu@example.com', nick: '美玲' },
      { name: '趙子豪', email: 'jhao.chao@example.com', nick: '子豪' },
    ] },
    t2: { tourTitle: '泰國曼谷四日遊', batch: '20260820-1團', members: [
      { name: '周欣怡', email: 'joy.chou@example.com', nick: '欣怡' },
      { name: '林建宏', email: 'jian.lin@example.com', nick: '建宏' },
    ] },
  },

  /* 我帶過的所有行程（含已完成），用於歷史團員 */
  pastTours: [
    { tourId: 't3', title: '京都文化深度六日', batch: '20260630-1團', count: 24 },
    { tourId: 't1', title: '日本東京五日遊', batch: '20260715-1團', count: 22 },
    { tourId: 't2', title: '泰國曼谷四日遊', batch: '20260820-1團', count: 18 },
    { tourId: 't6', title: '花蓮太魯閣三日遊', batch: '20260505-1團', count: 18 },
    { tourId: 't7', title: '北海道賞雪五日', batch: '20260210-1團', count: 26 },
  ],

  ongoing: [
    {
      tourId: 't3', title: '京都文化深度六日', dest: '京都, 日本', img: IMG.kyoto, dates: '2026/06/30 - 07/05', day: 'Day 3 / 6', members: 24,
      locations: [
        { name: '清水寺 · 二年坂', icon: 'building-arch', souvenirs: [
          { id: 's1', name: '八橋餅禮盒', price: 480, emo: '🍡' },
          { id: 's2', name: '宇治抹茶粉', price: 650, emo: '🍵' },
          { id: 's3', name: '京友禪手帕', price: 320, emo: '🧣' },
        ] },
        { name: '嵐山 · 竹林', icon: 'tree', souvenirs: [
          { id: 's4', name: '竹細工茶筒', price: 1200, emo: '🎋' },
          { id: 's5', name: '嵐山限定和菓子', price: 560, emo: '🍡' },
          { id: 's6', name: '湯豆腐調味組', price: 420, emo: '🥢' },
        ] },
        { name: '祇園 · 花見小路', icon: 'map-pin', souvenirs: [
          { id: 's7', name: '舞妓和風扇', price: 380, emo: '🪭' },
          { id: 's8', name: '京漬物三味', price: 540, emo: '🥬' },
          { id: 's9', name: '清酒一合瓶', price: 720, emo: '🍶' },
        ] },
      ],
      memberOrders: {
        m1: [{ id: 'mo1', product: '八橋餅禮盒', qty: 2, amount: 960, status: '已付款' }, { id: 'mo2', product: '宇治抹茶粉', qty: 1, amount: 650, status: '已出貨' }],
        m2: [{ id: 'mo3', product: '竹細工茶筒', qty: 1, amount: 1200, status: '未付款' }],
        m3: [{ id: 'mo4', product: '京漬物三味', qty: 3, amount: 1620, status: '待出貨' }, { id: 'mo5', product: '舞妓和風扇', qty: 2, amount: 760, status: '已付款' }],
        m4: [{ id: 'mo6', product: '清酒一合瓶', qty: 1, amount: 720, status: '已付款' }],
      },
      notices: [
        { id: 'nt1', type: '晨喚', headline: '明日 06:30 晨喚', body: 'Day 4 前往嵐山，請於 06:30 接聽晨喚電話，07:15 飯店大廳集合。', pub: true, time: '今天 21:10' },
        { id: 'nt2', type: '集合時間與地點', headline: '今日集合 08:00 · 大廳', body: '08:00 於飯店一樓大廳集合，攜帶護照影本與雨具。', pub: true, time: '今天 07:30' },
        { id: 'nt3', type: '行程概述', headline: 'Day 3 · 祇園與花見小路', body: '上午清水寺、二年坂散策，午餐湯豆腐，下午祇園、花見小路自由活動。', pub: true, time: '今天 07:35' },
        { id: 'nt4', type: '旅行社公告', headline: '颱風動態提醒', body: '旅行社持續關注西太平洋熱帶低壓，如影響回程航班將即時通知。', pub: false, time: '草稿' },
      ],
      reviews: [
        { mid: 'm1', rating: 5, text: '王領隊超細心，行程安排順暢，推薦的抹茶禮盒也很棒！' },
        { mid: 'm3', rating: 5, text: '講解很專業，還幫我們協調素食餐點，非常感謝。' },
        { mid: 'm2', rating: 4, text: '整體很好，希望自由活動時間可以再多一點點。' },
      ],
      chatKey: 'group1',
    },
  ],
  completed: [
    { tourId: 't6', title: '花蓮太魯閣三日遊', dest: '花蓮, 台灣', img: IMG.hualien, dates: '2026/05/05 - 05/07', avg: 4.8, count: 18,
      reviews: [{ mid: 'm2', rating: 5, text: '太魯閣導覽很精彩，領隊很照顧長輩。' }, { mid: 'm1', rating: 5, text: '行程豐富又不趕，下次還要參加！' }] },
    { tourId: 't7', title: '北海道賞雪五日', dest: '北海道, 日本', img: IMG.hokkaido, dates: '2026/02/10 - 02/14', avg: 4.9, count: 26,
      reviews: [{ mid: 'm3', rating: 5, text: '雪景太美了，領隊拍照技術一流。' }] },
  ],
  upcoming: [
    { tourId: 't1', title: '日本東京五日遊', dest: '東京, 日本', img: IMG.tokyo, dates: '2026/07/15 - 07/19', members: 22,
      video: 'https://www.youtube.com/embed/1La4QzGeaaQ',
      notes: ['帶團前確認團員護照效期 6 個月以上', '託運行李 23kg、隨身 7kg', '攜帶領隊聯絡卡與旅行社緊急電話', '當地電壓 100V，插座雙平腳'],
      flight: { dep: 'TPE 桃園 06:30 → NRT 成田 10:45', depAir: '長榮航空 BR198', ret: 'NRT 成田 18:20 → TPE 桃園 21:05', retAir: '長榮航空 BR197', pnr: 'TA-EVA-7X2K9', seat: '團體劃位，機場統一發放登機證' } },
    { tourId: 't2', title: '泰國曼谷四日遊', dest: '曼谷, 泰國', img: IMG.bangkok, dates: '2026/08/20 - 08/23', members: 18,
      video: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      notes: ['協助團員確認落地簽或電子簽', '當地氣候炎熱，提醒防曬與補水', '小費文化普遍，提醒團員備零錢'],
      flight: { dep: 'TPE 桃園 07:00 → BKK 素萬那普 09:50', depAir: '泰國航空 TG635', ret: 'BKK 素萬那普 20:35 → TPE 桃園 01:05+1', retAir: '泰國航空 TG634', pnr: 'TA-THAI-3M8P2', seat: '團體劃位，機場統一發放登機證' } },
  ],

  boutique: [
    { name: '京都西陣織絲巾', price: 1680, emo: '🧣' },
    { name: '職人手作和菓子', price: 880, emo: '🍡' },
    { name: '宇治抹茶精選組', price: 1250, emo: '🍵' },
    { name: '清水燒茶杯對組', price: 2200, emo: '🍶' },
  ],

  campaigns: [
    { id: 'c1', title: '京都限定 · 抹茶禮盒團購', body: '即日起至 07/05，宇治抹茶精選組團購價 9 折，滿三組免運。', pub: true, time: '今天 10:20', pointId: 'p1', rcpt: [] },
    { id: 'c2', title: '嵐山竹細工快閃', body: '竹細工茶筒限量 30 組，回覆 1 即可預訂，集結地點大廳領取。', pub: true, time: '昨天 18:40', pointId: 'p2', rcpt: [] },
    { id: 'c3', title: '清水燒對杯預購', body: '清水燒茶杯對組開放預購，回台後宅配到府。', pub: false, time: '草稿', pointId: '', rcpt: [] },
  ],
  points: [
    { id: 'p1', name: '京都站前飯店 · 大廳服務台', time: '每日 20:00 - 21:00', note: '領取當日團購商品' },
    { id: 'p2', name: '嵐山遊客中心 · 出口', time: '07/03 12:30 - 13:00', note: '午餐後集合發放' },
  ],
  dealOrders: [
    { id: 'd1', product: '宇治抹茶精選組', tour: '京都文化深度六日', date: '2026/07/02', member: '林小美', nick: '小美', email: 'may.lin@example.com', code: '京都文化深度六日_20260630-1團_001', qty: 2, amount: 2500, status: '已付款', recon: false, pointId: 'p1' },
    { id: 'd2', product: '竹細工茶筒', tour: '京都文化深度六日', date: '2026/07/02', member: '張家維', nick: '家維', email: 'chiawei.chang@example.com', code: '京都文化深度六日_20260630-1團_004', qty: 1, amount: 1200, status: '未付款', recon: false, pointId: 'p2' },
    { id: 'd3', product: '京都西陣織絲巾', tour: '京都文化深度六日', date: '2026/07/01', member: '黃雅婷', nick: '婷婷', email: 'yating.h@example.com', code: '京都文化深度六日_20260630-1團_003', qty: 1, amount: 1680, status: '已出貨', recon: true, pointId: 'p1' },
    { id: 'd4', product: '清水燒茶杯對組', tour: '京都文化深度六日', date: '2026/07/03', member: '陳志豪', nick: '阿豪', email: 'howie.chen@example.com', code: '京都文化深度六日_20260630-1團_002', qty: 1, amount: 2200, status: '待出貨', recon: false, pointId: 'p2' },
    { id: 'd5', product: '宇治抹茶精選組', tour: '京都文化深度六日', date: '2026/07/02', member: '李承恩', nick: '承恩', email: 'ethan.lee@example.com', code: '京都文化深度六日_20260630-1團_005', qty: 1, amount: 1250, status: '已付款', recon: false, pointId: 'p1' },
    { id: 'd6', product: '宇治抹茶精選組', tour: '京都文化深度六日', date: '2026/07/03', member: '王思穎', nick: '思穎', email: 'sara.wang@example.com', code: '京都文化深度六日_20260630-1團_006', qty: 1, amount: 1250, status: '待出貨', recon: false, pointId: 'p2' },
  ],

  income: {
    souv: [
      { item: '八橋餅禮盒', tour: '京都文化深度六日', date: '2026/07', shipped: 12, bonus: 1440 },
      { item: '宇治抹茶粉', tour: '京都文化深度六日', date: '2026/07', shipped: 8, bonus: 1040 },
      { item: '竹細工茶筒', tour: '京都文化深度六日', date: '2026/07', shipped: 5, bonus: 1800 },
      { item: '太魯閣紀念磁鐵', tour: '花蓮太魯閣三日遊', date: '2026/05', shipped: 20, bonus: 1200 },
    ],
    group: [
      { item: '宇治抹茶精選組', tour: '京都文化深度六日', date: '2026/07', shipped: 18, bonus: 5400 },
      { item: '京都西陣織絲巾', tour: '京都文化深度六日', date: '2026/07', shipped: 10, bonus: 3360 },
      { item: '清水燒茶杯對組', tour: '京都文化深度六日', date: '2026/07', shipped: 6, bonus: 2640 },
    ],
  },
  incomeSummary: { monthBonus: 18240, shipped: 86, total: 142000 },

  historyOrders: [
    { id: 'ho1', product: '宇治抹茶精選組', tour: '京都文化深度六日', date: '2026/07/02', amount: 2500, status: '已付款' },
    { id: 'ho2', product: '竹細工茶筒', tour: '京都文化深度六日', date: '2026/07/02', amount: 1200, status: '待出貨' },
    { id: 'ho3', product: '太魯閣紀念磁鐵', tour: '花蓮太魯閣三日遊', date: '2026/05/06', amount: 360, status: '已出貨' },
    { id: 'ho4', product: '北海道限定巧克力', tour: '北海道賞雪五日', date: '2026/02/12', amount: 980, status: '已取消' },
  ],
  historyTours: [
    { tourId: 't6', title: '花蓮太魯閣三日遊', dates: '2026/05/05 - 05/07', img: IMG.hualien, memories: 12 },
    { tourId: 't7', title: '北海道賞雪五日', dates: '2026/02/10 - 02/14', img: IMG.hokkaido, memories: 26 },
    { tourId: 't8', title: '首爾樂遊四日', dates: '2026/03/12 - 03/15', img: IMG.seoul, memories: 8 },
  ],

  notis: [
    { id: 'n1', type: 'order', title: '新訂單：竹細工茶筒 ×1', time: '8 分鐘前', read: false, text: '團員 張家維 於「京都文化深度六日」下單竹細工茶筒 1 件，待付款。' },
    { id: 'n2', type: 'msg', title: '林小美 傳送了訊息', time: '25 分鐘前', read: false, text: '領隊您好，請問明天晨喚是幾點呢？' },
    { id: 'n3', type: 'review', title: '黃雅婷 給了 5 星評價', time: '1 小時前', read: false, text: '講解很專業，還幫我們協調素食餐點，非常感謝。' },
    { id: 'n4', type: 'sys', title: '旅行社公告：颱風動態', time: '昨天', read: true, text: '請持續留意西太平洋熱帶低壓對回程航班之影響。' },
  ],

  chats: {
    group1: { name: '京都團 · 全體', group: true, msgs: [
      { self: true, name: '我 (領隊)', av: IMG.guideM, text: '各位團員早安，今日 08:00 大廳集合，記得帶雨具 ☔', time: '07:30' },
      { self: false, name: '林小美', av: IMG.m1, text: '收到！領隊辛苦了 🙌', time: '07:32' },
      { self: false, name: '陳志豪', av: IMG.m2, text: '請問午餐是湯豆腐嗎？', time: '07:35' },
      { self: true, name: '我 (領隊)', av: IMG.guideM, text: '是的，順正湯豆腐，素食者我已另外安排 😊', time: '07:36' },
    ] },
    m1: { name: '林小美', group: false, av: IMG.m1, msgs: [{ self: false, name: '林小美', av: IMG.m1, text: '領隊您好，請問明天晨喚是幾點呢？', time: '21:05' }] },
    m2: { name: '陳志豪', group: false, av: IMG.m2, msgs: [{ self: false, name: '陳志豪', av: IMG.m2, text: '我的抹茶粉訂單想改成 2 盒可以嗎？', time: '昨天' }] },
    m3: { name: '黃雅婷', group: false, av: IMG.m3, msgs: [] },
    m4: { name: '張家維', group: false, av: IMG.m4, msgs: [] },
  },
  dealChats: {},
}
