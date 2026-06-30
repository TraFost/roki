# TTS Server

Local TTS sidecar for Roki using [Piper TTS](https://github.com/rhasspy/piper) (MIT license, Apache 2.0).

## Voice

Default voice: **Ryan (US English, male)** -- `en_US-ryan-medium`

Available voices at [huggingface.co/rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US).

To swap voices, set:

```bash
ROKI_TTS_VOICE=en_US-lessac-medium
```

## Running

```bash
uvicorn server:app --port 8765
```

Will auto-download the voice model on first run.

## API

### `GET /health`

```json
{
  "status": "ok",
  "voice": "en_US-ryan-medium",
  "sample_rate": 22050
}
```

### `POST /tts`

```json
{ "text": "Hello, this is Roki." }
```

Returns `audio/wav`.
