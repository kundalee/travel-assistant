import { get, patch, post, resource } from '../resource'
import type { User } from '../types/admin'

export const usersApi = resource('admin.users', '後台 · 使用者 Users', {
  list: get<User[]>()('/admin/users', '使用者清單'),
  create: post<User, Omit<User, 'id'>>()('/admin/users', '建立使用者帳號（寄送初始密碼）'),
  update: patch<User, Partial<User>>()('/admin/users/:id', '修改姓名 / 身分 / 電話'),
})
