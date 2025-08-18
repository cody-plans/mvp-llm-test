# Hosting WebLLM Assets (Public Repo)

This repo serves static files to the browser via **raw.githubusercontent.com**.

## What to upload (from your personal machine)
- `webllm/web-llm.mjs` — the prebuilt WebLLM ES module (one file).
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` — small model folder containing:
  - `mlc-chat-config.json`
  - tokenizer files (e.g., `tokenizer.json`)
  - many weight shards (e.g., `params_shard-*.bin`)

> If your build includes a `.wasm` model library, place it in `webllm/` and note its filename for the snippet.

## Rules
- Keep **every file < 100 MB** (required for GitHub Raw).
- Repo must stay **public** so Chrome DevTools can fetch without auth.
- Do not rename shard files; paths must match `mlc-chat-config.json`.

## Sanity-check URLs (must open w/o login)
- `https://raw.githubusercontent.com/<your-user>/mvp-llm-test/main/webllm/web-llm.mjs`
- `https://raw.githubusercontent.com/<your-user>/mvp-llm-test/main/models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/mlc-chat-config.json`

If both load in a browser, your company Chrome can fetch them too.
