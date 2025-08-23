# WebLLM Asset Hosting

This repository serves static files for browser-based WebLLM applications via **raw.githubusercontent.com**.

## Required Files

### WebLLM Runtime
- `webllm/web-llm.mjs` — Prebuilt WebLLM ES module

### Model Files
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` — MLC format model containing:
  - `mlc-chat-config.json` — Model configuration
  - Tokenizer files (`tokenizer.json`, `vocab.json`)
  - Weight shards (`params_shard-*.bin`)

### Optional
- `.wasm` model library files in `webllm/` directory

## Upload Requirements

- **File size limit**: < 100 MB per file (GitHub Raw requirement)
- **Repository**: Must remain **public** for browser access
- **File names**: Do not rename shard files; paths must match `mlc-chat-config.json`

## Verification URLs

Test these URLs in a browser (must open without login):
- `https://raw.githubusercontent.com/<your-user>/mvp-llm-test/main/webllm/web-llm.mjs`
- `https://raw.githubusercontent.com/<your-user>/mvp-llm-test/main/models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/mlc-chat-config.json`

## Usage

Files are accessed via raw GitHub URLs in browser applications:
```js
const runtime = await import('https://raw.githubusercontent.com/user/repo/main/webllm/web-llm.mjs');
```
