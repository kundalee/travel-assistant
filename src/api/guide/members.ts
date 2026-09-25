import { get, resource } from '../resource'
import type { Member, PastTour, RosterSeed } from '../types/guide'

export const membersApi = resource('guide.members', '領隊 · 團員名冊 Members', {
  list: get<{ members: Member[]; rosters: Record<string, RosterSeed>; pastTours: PastTour[] }>()('/guide/members', '團員名冊、歷史團員'),
})
