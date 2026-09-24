import type { PartnerData } from '../types/partner'

/* 店家首頁公告 / 精品好物 ＋ 收入與已取消訂單 */
export const SAMPLE: PartnerData = {
  notices: [
    { type: 'warn', title: '端午連假出貨提醒', date: '2026-06-05', body: '6/8–6/10 物流暫停收件，請提前於 6/6 前完成備貨與交寄。' },
    { type: 'info', title: '新增團購商品分類', date: '2026-05-28', body: '後台新增「海鮮水產」與「奶蛋肉品」分類，歡迎上架優選商品。' },
  ],
  goods: [
    { name: '手工鳳梨酥禮盒', price: '480', note: '伴手首選 · 12 入' },
    { name: '職人黑糖薑茶', price: '320', note: '養生素食 · 隨身包' },
    { name: '工藝陶瓷茶具組', price: '1,280', note: '生活用品 · 送禮體面' },
  ],
  income: {
    souvenir: [
      { product: '手工鳳梨酥禮盒', tour: '北海道賞雪5日', date: '2026-06-18', qty: 12, amount: 5760, shipped: true, cost: 3571, bonus: 576 },
      { product: '工藝陶瓷茶具組', tour: '京都文化深度6日', date: '2026-06-20', qty: 4, amount: 5120, shipped: true, cost: 3174, bonus: 512 },
      { product: '手工鳳梨酥禮盒', tour: '關西親子輕旅4日', date: '2026-06-21', qty: 8, amount: 3840, shipped: true, cost: 2381, bonus: 384 },
      { product: '職人黑糖薑茶', tour: '北海道賞雪5日', date: '2026-06-18', qty: 20, amount: 6400, shipped: false, cost: 3968, bonus: 640 },
    ],
    groupbuy: [
      { product: '日本零食箱', tour: '關西親子輕旅4日', date: '2026-06-19', qty: 15, amount: 9750, shipped: true, cost: 6045, bonus: 975 },
      { product: '北海道生乳捲', tour: '北海道賞雪5日', date: '2026-06-22', qty: 10, amount: 5500, shipped: true, cost: 3410, bonus: 550 },
      { product: '產地直送水果箱', tour: '京都文化深度6日', date: '2026-06-23', qty: 6, amount: 4680, shipped: false, cost: 2902, bonus: 468 },
    ],
  },
  cancelled: [
    { orderNo: 'SO-20260615-003', product: '工藝陶瓷茶具組', tour: '京都文化深度6日', date: '2026-06-15', amount: 1280, reconciled: false },
    { orderNo: 'GB-20260616-011', product: '日本零食箱', tour: '關西親子輕旅4日', date: '2026-06-16', amount: 650, reconciled: true },
    { orderNo: 'SO-20260617-007', product: '職人黑糖薑茶', tour: '北海道賞雪5日', date: '2026-06-17', amount: 320, reconciled: false },
  ],
}
