/* 假後端進入點：載入各模組的端點實作（僅在有請求需由假後端回應時才動態載入） */
import '../all'
import './auth'
import './traveler'
import './partner'
import './guide'
import './admin'

export { handle, unimplemented } from './server'
