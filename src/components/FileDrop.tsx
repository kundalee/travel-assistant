import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from './toast'

interface FileDropProps {
  /** 與 <input type="file"> 的 accept 相同，例：'.csv,.xlsx' 或 'image/*' */
  accept?: string
  multiple?: boolean
  /** 選擇或拖放的檔案（已依 accept 篩選；單選時只有一個） */
  onFiles: (files: File[]) => void
  disabled?: boolean
  children: ReactNode
}

/* 檔案是否符合 accept：副檔名（.csv）、完整類型（text/csv）或萬用類型（image/*） */
function matches(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase(), type = file.type.toLowerCase()
  return accept.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean).some((a) =>
    a.startsWith('.') ? name.endsWith(a) : a.endsWith('/*') ? type.startsWith(a.slice(0, -1)) : type === a)
}

/* 開著上傳區時，檔案沒有放進上傳區也不要讓瀏覽器直接開啟該檔案 */
function useBlockStrayDrops() {
  useEffect(() => {
    const block = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault() }
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])
}

/**
 * 上傳區：點擊選擇檔案，或把檔案拖放進來（拖曳經過時顯示 .dragging）。
 * 樣式沿用各入口的 .upload-zone。
 */
export function FileDrop({ accept, multiple, onFiles, disabled, children }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const depth = useRef(0)
  const [dragging, setDragging] = useState(false)
  useBlockStrayDrops()

  function take(list: FileList | null | undefined) {
    const files = [...(list ?? [])]
    if (!files.length) return
    const ok = files.filter((f) => matches(f, accept))
    if (ok.length < files.length) toast(`不支援的檔案：${files.filter((f) => !ok.includes(f)).map((f) => f.name).join('、')}`, 'alert-circle')
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1))
  }

  const open = () => { if (!disabled) inputRef.current?.click() }

  return (
    <div
      className={`upload-zone${dragging ? ' dragging' : ''}`} role="button" tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined} onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
      onDragEnter={(e) => { e.preventDefault(); if (disabled) return; depth.current++; setDragging(true) }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? 'none' : 'copy' }}
      onDragLeave={() => { if (--depth.current <= 0) { depth.current = 0; setDragging(false) } }}
      onDrop={(e) => { e.preventDefault(); depth.current = 0; setDragging(false); if (!disabled) take(e.dataTransfer.files) }}
    >
      {children}
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden
        onChange={(e) => { take(e.target.files); e.target.value = '' }} />
    </div>
  )
}
