import { get, post, resource, upload } from '../resource'
import type { AlbumPhoto } from '../types/traveler'

type Files = { files: File[] }

export const photosApi = resource('traveler.photos', '團員 · 相簿 Photos', {
  album: get<AlbumPhoto[]>()('/traveler/album', '團員相簿'),
  share: upload<{ count: number }, Files>()('/traveler/trips/:tourId/photos', '分享照片給領隊與團員'),
  uploadToAlbum: upload<{ count: number }, Files>()('/traveler/albums/:album/photos', '上傳照片到團員相簿'),
  favorite: post()('/traveler/album/photos/:photoId/favorite', '收藏相簿照片', 'U'),
})
