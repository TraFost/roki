# Roki

> **Cross-platform AI desktop assistant.** Windows-first, built with Tauri v2 + React + Bun.

Roki lives in your system tray. Hit a global shortcut, it captures your screen, sends it to an AI model alongside your voice or text query, and streams the response back — right next to your cursor. Think of it as having a copilot that can *see* what you're doing.

![Roki demo](https://github.com/user-attachments/assets/placeholder-demo.gif)

---

## 🧠 What it does

1. **Press a shortcut** (`Ctrl+Shift+Space`) or click the tray icon
2. **Roki captures** your screen (all monitors, JPEG-compressed, multi-display aware)
3. **AI processes** the screenshot + your query via your choice of provider
4. **Response streams** back in a floating dark-theme panel

Optional (coming soon):
- **Voice input** — push-to-talk, real-time transcription
- **Element pointing** — the AI can direct a blue cursor overlay to UI elements
- **Text-to-speech** — responses spoken aloud

---

## ✨ Credits

This project is a cross-platform port and evolution of [**Clicky**](https://github.com/farzaa/clicky) by [Farza](https://x.com/farzatv). Clicky was the original macOS-only AI companion — menu bar app, cursor overlay, streaming voice, the whole package. Roki rebuilds those ideas from the ground up for **Windows and beyond**, using Tauri v2, React, and TypeScript.

> All credit for the original concept and design goes to Farza. This wouldn't exist without Clicky.

Original Clicky is MIT-licensed and available at [github.com/farzaa/clicky](https://github.com/farzaa/clicky).

---

## 🏗️ Architecture

Roki is a **Bun monorepo** with Turbo for orchestration:

```
roki/
├── apps/
│   └── desktop/              # Tauri v2 desktop app (Windows)
│       ├── src/               # React frontend (Vite + Tailwind v4)
│       │   ├── App.tsx         # Entry point, engine wiring
│       │   ├── Panel.tsx       # Dark-themed floating companion panel
│       │   └── TauriBridge.ts  # Tauri IPC helpers
│       └── src-tauri/          # Rust backend
│           ├── capture.rs      # Multi-monitor screenshot (xcap)
│           ├── shortcut.rs     # Global keyboard shortcut
│           ├── overlay.rs      # Transparent overlay windows
│           └── main.rs         # Tray icon, commands, setup
├── packages/
│   ├── ai/                    # AI provider layer
│   │   ├── anthropic.ts       #   Claude (streaming SSE)
│   │   ├── openai.ts          #   GPT-4o
│   │   ├── gemini.ts          #   Gemini 2.0 Flash
│   │   ├── openrouter.ts      #   OpenRouter (any model)
│   │   └── ollama.ts          #   Ollama (local LLMs)
│   ├── core/                  # RokiEngine state machine
│   ├── capture/               # Screen processing (resize, compress, label)
│   ├── prompts/               # System prompts for AI
│   ├── config/                # Zod settings schemas
│   ├── shared/                # Shared TypeScript types
│   └── sdk/                   # Public API re-exports
└── worker/                    # Cloudflare Worker proxy (ported from Clicky)
```

### Data flow

```
Shortcut (Ctrl+Shift+Space) or Click Tray
        │
        ▼
  ┌─────────────┐     ┌──────────────┐
  │  Tauri IPC   │────▶│ screen       │
  │  invoke()    │     │ capture.rs   │
  └─────────────┘     └──────┬───────┘
                             │ JPEG base64
                             ▼
  ┌─────────────┐     ┌──────────────┐
  │  AI Provider │◀────│ RokiEngine   │
  │  (SSE stream)│     │ (state       │
  │              │     │  machine)    │
  └──────┬──────┘     └──────────────┘
         │ streamed text
         ▼
  ┌─────────────┐
  │  Panel.tsx   │
  │  (React UI)  │
  └─────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Windows 10/11** (macOS/Linux support planned)
- **Bun** 1.3+ — `powershell -c "irm bun.sh/install.ps1 | iex"`
- **Rust** toolchain — `winget install Rust.Rustup` then `rustup default stable`
- **MSYS2** (for GNU toolchain on Windows) — `winget install MSYS2.MSYS2`

### 1. Clone and install

```bash
git clone https://github.com/your-org/roki.git
cd roki
bun install
```

### 2. Build the Tauri app

```bash
cd apps/desktop
cargo tauri dev
```

This compiles the Rust backend, bundles the React frontend, and launches with:
- System tray icon (no main window)
- Global shortcut `Ctrl+Shift+Space`
- Floating panel on tray click

> ⚠️ On Windows with the GNU toolchain, ensure `C:\msys64\mingw64\bin` is in your `PATH` for the resource compiler.

### 3. Set up API keys

Roki needs API keys for AI inference. Configure via environment variables or by passing them to the engine constructor:

```typescript
const engine = new RokiEngine('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514',
})
```

Supported providers and their env vars:
| Provider    | Env Variable          | Default Model           |
|-------------|----------------------|-------------------------|
| Anthropic   | `ANTHROPIC_API_KEY`  | `claude-sonnet-4-20250514` |
| OpenAI      | `OPENAI_API_KEY`     | `gpt-4o`                |
| Gemini      | `GEMINI_API_KEY`     | `gemini-2.0-flash`      |
| OpenRouter  | `OPENROUTER_API_KEY` | `anthropic/claude-3.5-sonnet` |
| Ollama      | _(none, local)_      | `llama3.2`              |

---

## 🧪 Development

### TypeCheck everything

```bash
bun run typecheck
```

Verifies all 10 packages in parallel (Turbo). Cargo-check the Rust side:

```bash
cd apps/desktop
cargo check
```

### Package overview

| Package | Description | Status |
|---------|-------------|--------|
| `@roki/ai` | 5 streaming AI providers | ✅ |
| `@roki/core` | State machine, event system, history | ✅ |
| `@roki/capture` | Screen resize, compress, multi-display label | ✅ |
| `@roki/prompts` | System prompts | ✅ |
| `@roki/config` | Zod settings schemas | ✅ |
| `@roki/shared` | Shared TypeScript types | ✅ |
| `roki-desktop` | Tauri app (React + Rust) | ✅ |
| Voice pipeline | Push-to-talk, transcription | 🚧 |
| TTS | Text-to-speech playback | 🚧 |
| Element pointing | Blue cursor overlay animation | 🚧 |
| Settings UI | Full settings panel + persistence | 🚧 |

---

## 🗺️ Roadmap

- **Phase 1** (✅ Complete) — Core pipeline: shortcut → capture → AI → panel
- **Phase 1b** (🚧 In progress) — Voice pipeline: push-to-talk + transcription
- **Phase 1c** (⏳ Planned) — TTS playback + element pointing
- **Phase 2** (⏳ Planned) — Polish: settings, onboarding, error handling
- **Phase 3** (⏳ Planned) — Open-source release: installer, docs, CI

---

## 🤝 Contributing

PRs welcome! The codebase is designed to be approachable:

- **Rust backend** in `apps/desktop/src-tauri/src/` — Tauri commands, global shortcuts, screen capture
- **React frontend** in `apps/desktop/src/` — Panel UI, IPC bridge
- **TypeScript packages** in `packages/` — AI providers, state machine, config, types

Before opening a PR:
1. Run `bun run typecheck` — all 10 packages must pass
2. Run `cargo check` in `apps/desktop` — Rust must compile cleanly
3. Keep commits granular (one logical change per commit)
4. Update `AGENTS.md` if you add new files or change the architecture

---

## 📄 License

MIT. Originally inspired by [Clicky](https://github.com/farzaa/clicky) by Farza (also MIT).

Go build something cool.
