import { type EngineState } from '@roki/shared'

interface PanelProps {
  engineState: EngineState
  responseText: string
  error: string | null
  shortcutLabel: string
  loading: boolean
  onCapture: () => void
  onClear: () => void
  onQuit: () => void
  hasResponse: boolean
}

const stateIcons: Record<EngineState, string> = {
  idle: '○',
  capturing: '◎',
  processing: '◌',
  responding: '◉',
}

const stateLabels: Record<EngineState, string> = {
  idle: 'Ready',
  capturing: 'Capturing screen...',
  processing: 'Thinking...',
  responding: 'Speaking...',
}

function EngineIndicator({ state }: { state: EngineState }) {
  const colors: Record<EngineState, string> = {
    idle: 'bg-slate-500',
    capturing: 'bg-amber-500',
    processing: 'bg-indigo-500',
    responding: 'bg-emerald-500',
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colors[state]} transition-colors duration-300`} />
      <span className="text-xs font-medium text-slate-400">{stateLabels[state]}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeContent = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-slate-950/80 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-slate-200 border border-slate-700/50">
            <code>{codeContent}</code>
          </pre>,
        )
        codeContent = ''
      }
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line
      continue
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-white mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-semibold text-white mt-3 mb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>)
    } else if (line.startsWith('- ')) {
      elements.push(<li key={i} className="text-sm text-slate-300 ml-4 list-disc">{line.slice(2)}</li>)
    } else if (line.match(/^\d+\.\s/)) {
      elements.push(<li key={i} className="text-sm text-slate-300 ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>)
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="text-sm text-slate-400 border-l-2 border-indigo-500/50 pl-3 my-1 italic">{line.slice(2)}</blockquote>)
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      const rendered = renderInline(line)
      elements.push(<p key={i} className="text-sm text-slate-300 leading-relaxed">{rendered}</p>)
    }
  }

  return <div className="space-y-0.5">{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let idx = 0

  const regex = /(\*\*.*?\*\*|`.*?`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index))
    }
    const content = match[1]
    if (content.startsWith('**') && content.endsWith('**')) {
      parts.push(<strong key={idx++} className="text-slate-100 font-semibold">{content.slice(2, -2)}</strong>)
    } else if (content.startsWith('`') && content.endsWith('`')) {
      parts.push(<code key={idx++} className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded text-xs font-mono">{content.slice(1, -1)}</code>)
    }
    lastIndex = match.index + match[1].length
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

export function Panel({
  engineState,
  responseText,
  error,
  shortcutLabel,
  loading,
  onCapture,
  onClear,
  onQuit,
  hasResponse,
}: PanelProps) {
  const isIdle = engineState === 'idle'
  const isProcessing = !isIdle

  return (
    <div className="w-[420px] max-h-[640px] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
            R
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Roki</span>
        </div>
        <EngineIndicator state={engineState} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {/* Loading */}
        {loading && <Spinner />}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!hasResponse && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700/30 flex items-center justify-center mb-3">
              <span className="text-lg text-slate-500">{stateIcons.idle}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">Press <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-600/50">{shortcutLabel}</kbd> or click Capture to start</p>
          </div>
        )}

        {/* Response */}
        {hasResponse && !loading && (
          <div className="animate-fadeIn">
            <MarkdownRenderer text={responseText} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-700/30 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onCapture}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.98] shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>◎</span>
                Capture & Ask
              </span>
            )}
          </button>
          <button
            onClick={onClear}
            disabled={!hasResponse}
            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
            title="Clear response"
          >
            ✕
          </button>
          <button
            onClick={onQuit}
            className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 text-sm rounded-lg transition-colors"
            title="Quit Roki"
          >
            ⏻
          </button>
        </div>
      </div>
    </div>
  )
}

export default Panel
