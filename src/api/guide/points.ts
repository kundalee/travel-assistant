import { del, get, post, put, resource } from '../resource'
import type { GatherPoint } from '../types/guide'

export const pointsApi = resource('guide.points', '領隊 · 集結地點 Points', {
  list: get<GatherPoint[]>()('/guide/points', '集結地點'),
  create: post<GatherPoint, Omit<GatherPoint, 'id'>>()('/guide/points', '新增集結地點'),
  update: put<GatherPoint, GatherPoint>()('/guide/points/:pointId', '修改集結地點'),
  remove: del()('/guide/points/:pointId', '刪除集結地點'),
})
