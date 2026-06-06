// components/operator/CameraButton.tsx
'use client'

import { Camera } from 'lucide-react'
import { useRef } from 'react'

interface Props {
  onCapture: (filename: string) => void
}

export function CameraButton({ onCapture }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCapture(file.name)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <label
      aria-label="Escanear código de barras"
      className="w-[44px] h-[44px] bg-surface-elevated border border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-border/60 transition-colors flex-shrink-0"
      style={{ touchAction: 'manipulation' }}
    >
      <Camera size={20} className="text-muted-foreground" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
      />
    </label>
  )
}
