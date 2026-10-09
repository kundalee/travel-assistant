import { get, patch, post, resource } from '../resource'
import type { User, UserCreate, UserUpdate } from '../types/admin'

/* 帳號管理（管理員）：路徑沿用後端的 /users */
export const usersApi = resource('admin.users', '後台 · 使用者 Users', {
  list: get<User[]>()('/users', '使用者清單'),
  create: post<User, UserCreate>()('/users', '建立使用者帳號（含初始密碼）'),
  update: patch<User, UserUpdate>()('/users/:id', '修改姓名 / 電話 / 啟用狀態 / 身分'),
})
