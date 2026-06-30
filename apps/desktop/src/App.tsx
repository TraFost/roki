import { useState, useEffect, useRef, useCallback } from 'react'
import { RokiEngine } from '@roki/core'
import type { StreamChunk, EngineState, RokiError } from '@roki/shared'
import { Panel } from './components/Panel'
import { captureScreens, getShortcutLabel, onMenuCapture, quitApp } from './components/TauriBridge'

function App() {
  const [engineState, setEngineState] = useState<EngineState>('idle')
  const [responseText, setResponseText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shortcutLabel, setShortcutLabel] = useState('Ctrl+Shift+Space')
  const [loading, setLoading] = useState(false)
  const engineRef = useRef<RokiEngine | null>(null)
  const hasResponse = responseText.length > 0

  useEffect(() => {
    const engine = new RokiEngine('anthropic', {
      model: 'claude-sonnet-4-6',
    })

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

    engine.on('done', () => {
      setLoading(false)
    })

    engineRef.current = engine

    void getShortcutLabel().then(setShortcutLabel)

    const unlistenPromise = onMenuCapture(() => {
      void handleCapture()
    })

    return () => {
      engine.cancel()
      void unlistenPromise.then((unlisten) => unlisten())
    }
  }, [])

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
