import { Download, RefreshCw, Share, Wifi, WifiOff, X } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

export default function PWABanner() {
  const { canShowInstallBanner, hasUpdate, isIOS, isOnline, install, dismiss, applyUpdate } =
    usePWA()

  return (
    <>
      {/* Offline bar */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-open-ink px-4 py-2 text-xs font-semibold text-white">
          <WifiOff size={13} strokeWidth={2} />
          Sin conexión — mostrando contenido guardado
        </div>
      )}

      {/* SW update toast */}
      {hasUpdate && (
        <div className="flex items-center justify-between gap-3 border-b border-open-light bg-open-surface px-4 py-2.5">
          <span className="text-xs font-semibold text-open-ink">
            Nueva versión disponible
          </span>
          <button
            type="button"
            onClick={applyUpdate}
            className="flex items-center gap-1.5 bg-open-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <RefreshCw size={12} strokeWidth={2} />
            Actualizar
          </button>
        </div>
      )}

      {/* Install banner */}
      {canShowInstallBanner && (
        <div className="flex items-center justify-between gap-3 border-b border-open-light bg-open-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center border border-open-light bg-open-bg">
              <Download size={16} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold text-open-ink">
                Instalar OPEN
              </p>
              {isIOS ? (
                <p className="text-[11px] text-open-muted">
                  Toca <Share size={10} className="inline" /> y luego "Agregar a pantalla de inicio"
                </p>
              ) : (
                <p className="text-[11px] text-open-muted">
                  Accede más rápido desde tu pantalla de inicio
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isIOS && (
              <button
                type="button"
                onClick={install}
                className="h-8 bg-open-primary px-3 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Instalar
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar"
              className="grid h-8 w-8 place-items-center border border-open-light bg-open-bg text-open-muted transition hover:border-open-ink"
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
