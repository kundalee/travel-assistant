import { get, resource } from '../resource'
import type { IncomeCat, IncomeRow } from '../types/partner'

export const incomeApi = resource('partner.income', '店家 · 我的收入 Income', {
  get: get<Record<IncomeCat, IncomeRow[]>>()('/partner/income', '我的收入（紀念商品 / 團購，含利潤）'),
})
