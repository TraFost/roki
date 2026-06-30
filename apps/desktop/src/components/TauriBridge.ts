import type { ScreenCapture } from '@roki/shared'

interface MonitorCapture {
  id: number
  label: string
  width: number
  height: number
  data_base64: string
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export async function captureScreens(): Promise<ScreenCapture[]> {
  if (!isTauri()) return []
  const monitors: MonitorCapture[] = await (window as any).__TAURI_INTERNALS__.invoke('capture_screens')
  return monitors.map((m: MonitorCapture) => ({
    imageData: base64ToUint8Array(m.data_base64),
    label: m.label,
    isCursorScreen: m.id === 0,
    displayWidthInPoints: m.width,
    displayHeightInPoints: m.height,
    displayFrame: { x: 0, y: 0, width: m.width, height: m.height },
    screenshotWidthInPixels: m.width,
    screenshotHeightInPixels: m.height,
  }))
}

export async function getShortcutLabel(): Promise<string> {
  if (!isTauri()) return 'Ctrl+Shift+Space'
  return (window as any).__TAURI_INTERNALS__.invoke('get_shortcut_label')
}

export async function onMenuCapture(handler: () => void): Promise<() => void> {
  if (!isTauri()) return () => {}
  const unlisten = await (window as any).__TAURI_INTERNALS__.event?.listen('menu-capture', handler)
  return () => {
    unlisten?.()
  }
}

export function quitApp(): void {
  if (!isTauri()) return
  void (window as any).__TAURI_INTERNALS__.invoke('quit')
}

export { isTauri }
