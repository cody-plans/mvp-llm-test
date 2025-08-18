# WebLLM Hosting Progress

**Runtime**
- Present at: `webllm/web-llm.mjs`
- Reachable via raw URL (verified manually in browser)

**Model (tiny, MLC format)**
- Folder: `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/`
- Includes:
  - `mlc-chat-config.json`
  - tokenizer files: `tokenizer.json`, `tokenizer_config.json`, `vocab.json`, `merges.txt`
  - weight shards: `params_shard_0.bin … params_shard_7.bin` (each <100 MB)
- Raw manifest opens in browser (verified)

**How the snippet loads it**
- Imports `webllm/web-llm.mjs` as an ES module (via Blob)
- Points engine to `models/<MODEL_ID>/` folder
- Engine reads `mlc-chat-config.json` and fetches shards on first run; then cached

**Next steps**
- Use the Chrome snippet with `USE_LLM = true`
- First run may take a minute while shards download
- If network blocks raw.githubusercontent.com, switch snippet ORIGIN to a local/extension host
