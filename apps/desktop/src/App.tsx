import { useState, useEffect, useRef, useCallback } from 'react'
import { RokiEngine } from '@roki/core'
import type { StreamChunk, EngineState, RokiError } from '@roki/shared'
import { TTSClient } from '@roki/tts'
import { Panel } from './components/Panel'
import { captureScreens, getShortcutLabel, onMenuCapture, quitApp } from './components/TauriBridge'

function App() {
  const [engineState, setEngineState] = useState<EngineState>('idle')
  const [responseText, setResponseText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shortcutLabel, setShortcutLabel] = useState('Ctrl+Shift+Space')
  const [loading, setLoading] = useState(false)
  const engineRef = useRef<RokiEngine | null>(null)
  const ttsRef = useRef<TTSClient | null>(null)
  const responseTextRef = useRef('')
  const hasResponse = responseText.length > 0

  useEffect(() => {
    responseTextRef.current = responseText
  }, [responseText])

  const handleTtsFinished = useCallback(() => {
    setEngineState('idle')
    setLoading(false)
  }, [])

  useEffect(() => {
    const engine = new RokiEngine('anthropic', {
      model: 'claude-sonnet-4-6',
    })
    const tts = new TTSClient()

    engine.on('stateChange', (state: EngineState) => {
      setEngineState(state)
      if (state === 'idle') setLoading(false)
    })

    engine.on('chunk', (chunk: StreamChunk) => {
      if (chunk.type === 'text' && chunk.content) {
        setResponseText((prev) => prev + chunk.content)
      }
      if (chunk.type === 'done') {
        setLoading(false)
      }
      if (chunk.type === 'error' && chunk.error) {
        setError(chunk.error)
        setLoading(false)
      }
    })

    engine.on('error', (err: RokiError) => {
      setError(err.message ?? 'An unexpected error occurred')
      setLoading(false)
    })

    engine.on('done', async () => {
      setLoading(false)

      const text = responseTextRef.current
      if (text && await tts.isAvailable()) {
        setEngineState('responding')
        setLoading(true)
        try {
          await tts.speak(text)
        } catch {
        }
        handleTtsFinished()
      }
    })

    engineRef.current = engine
    ttsRef.current = tts

    void getShortcutLabel().then(setShortcutLabel)

    const unlistenPromise = onMenuCapture(() => {
      void handleCapture()
    })

    return () => {
      engine.cancel()
      tts.stop()
      void unlistenPromise.then((unlisten) => unlisten())
    }
  }, [handleTtsFinished])

  const handleCapture = useCallback(async () => {
    const engine = engineRef.current
    if (!engine || engine.state !== 'idle') return

    setError(null)
    setResponseText('')
    setLoading(true)

    try {
      const screens = await captureScreens()
      if (screens.length === 0) {
        setError('No screens found to capture')
        setLoading(false)
        return
      }

      engine.run(screens, 'What am I looking at?')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to capture screen'
      setError(message)
      setLoading(false)
    }
  }, [])

  const handleClear = useCallback(() => {
    ttsRef.current?.stop()
    setResponseText('')
    setError(null)
    engineRef.current?.clearHistory()
  }, [])

  const handleQuit = useCallback(() => {
    quitApp()
  }, [])

  return (
    <div className="flex items-start justify-center min-h-screen p-4">
      <Panel
        engineState={engineState}
        responseText={responseText}
        error={error}
        shortcutLabel={shortcutLabel}
        loading={loading}
        hasResponse={hasResponse}
        onCapture={handleCapture}
        onClear={handleClear}
        onQuit={handleQuit}
      />
    </div>
  )
}

export default App
