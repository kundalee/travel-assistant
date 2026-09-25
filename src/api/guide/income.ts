import { get, resource } from '../resource'
import type { IncomeCat, IncomeRow, IncomeSummary } from '../types/guide'

export const incomeApi = resource('guide.income', '領隊 · 我的收入 Income', {
  get: get<{ income: Record<IncomeCat, IncomeRow[]>; incomeSummary: IncomeSummary }>()('/guide/income', '我的收入（明細與本月摘要）'),
})
