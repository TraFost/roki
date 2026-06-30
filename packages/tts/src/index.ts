function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export class TTSClient {
  private audioContext: AudioContext | null = null
  private currentSource: AudioBufferSourceNode | null = null

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  async speak(text: string): Promise<void> {
    if (!isTauri()) return

    const wavBytes: number[] = await (window as any).__TAURI_INTERNALS__.invoke('tts_speak', { text })
    const buffer = new Uint8Array(wavBytes)

    const ctx = this.getContext()
    const audioBuffer = await ctx.decodeAudioData(buffer.buffer as ArrayBuffer)

    this.stop()

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.start(0)
    this.currentSource = source

    return new Promise((resolve) => {
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null
        }
        resolve()
      }
    })
  }

  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch {
      }
      this.currentSource = null
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!isTauri()) return false
    try {
      return await (window as any).__TAURI_INTERNALS__.invoke('tts_status')
    } catch {
      return false
    }
  }
}
