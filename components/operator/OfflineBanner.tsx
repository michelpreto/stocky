// components/operator/OfflineBanner.tsx

interface Props {
  isOnline: boolean
  pendingCount: number
}

export function OfflineBanner({ isOnline, pendingCount }: Props) {
  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/30 text-warning text-xs font-medium flex-shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
      <span>
        Offline — sincronizando ao reconectar
        {pendingCount > 0 && (
          <span className="ml-1 font-bold">· {pendingCount} baixas aguardando</span>
        )}
      </span>
    </div>
  )
}
