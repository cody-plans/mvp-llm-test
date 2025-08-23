# MVP – Chrome Snippet LLM Classifier (No npm)

This repo proves our company environment can:
1) Load an ES module and JSON from GitHub Raw,
2) Run an LLM-based classifier using WebLLM runtime,
3) Export a CSV – all without npm/Hugging Face/servers.

## Files
- `webllm/web-llm.mjs` – WebLLM runtime engine.
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` – MLC format model files.
- `data/taxonomy.json` – category → subcategories.
- `data/demo-questions.json` – sample questions.

## How to test (on your company PC)
1. Open any webpage in Chrome.
2. Press **F12** → **Sources** → **Snippets** → New.
3. Paste the snippet below, set `REPO` to `<your-github-username>/mvp-llm-test`, then Run.

```js
// ======== EDIT ME ========
const REPO   = "<your-github-username>/mvp-llm-test";
const BRANCH = "main";
// =========================

(async () => {
  const GH_RAW = (path) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
  
  async function importFromGitHub(pathToESM) {
    try {
      const res = await fetch(GH_RAW(pathToESM));
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText} for ${pathToESM}`);
      const code = await res.text();
      const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
      const module = await import(url);
      
      return module;
    } catch (error) {
      console.error(`[MVP] ❌ Failed to import ${pathToESM}:`, error);
      throw error;
    }
  }

  try {
    console.time("[MVP] total");
    
    // 1) Load WebLLM runtime
    const webllm = await importFromGitHub("webllm/web-llm.mjs");
    console.log("[MVP] WebLLM runtime loaded");

    // 2) Load taxonomy + demo questions
    const [taxonomy, questions] = await Promise.all([
      fetch(GH_RAW("data/taxonomy.json")).then(r => r.json()),
      fetch(GH_RAW("data/demo-questions.json")).then(r => r.json())
    ]);
    console.log("[MVP] Loaded taxonomy & questions:", { taxonomy, questions });

    // 3) Validate data
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions loaded');
    }
    if (!taxonomy || Object.keys(taxonomy).length === 0) {
      throw new Error('No taxonomy loaded');
    }

    // 4) Initialize LLM engine
    const engine = await webllm.CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
      appConfig: {
        model_list: [{
          model: GH_RAW("models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/main"),
          model_id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"
        }]
      }
    });
    console.log("[MVP] LLM engine ready");

    // 5) Run LLM classification
    const results = [];
    for (const q of questions) {
      const messages = [
        { role: "system", content: "You are a JSON classifier. Return ONLY a JSON object with keys: category, subcategory, confidence, rationale." },
        { role: "user", content: `Classify: ${q}` }
      ];
      const r = await engine.chat.completions.create({ messages, temperature: 0, max_tokens: 120 });
      const content = r.choices?.[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(content);
        results.push({ question: q, ...parsed });
      } catch {
        results.push({ question: q, category: "Other", subcategory: "General", confidence: 0, rationale: "Parse fail" });
      }
    }
    console.table(results);

    // 6) Generate and download CSV
    const csv = [
      ["question","category","subcategory","confidence","rationale"].join(","),
      ...results.map(r => [r.question, r.category, r.subcategory, r.confidence, r.rationale]
        .map(s => `"${String(s).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "classification_results.csv" });
    a.click(); 
    URL.revokeObjectURL(url);

    console.timeEnd("[MVP] total");
    console.log("[MVP] ✅ All good. CSV downloaded.");
    
  } catch (error) {
    console.error("[MVP] ❌ Critical error:", error);
    console.error("[MVP] Stack trace:", error.stack);
  }
})();
```

## Raw URLs for Testing
These URLs can be accessed directly to verify the files are reachable:

- **WebLLM Runtime**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/webllm/web-llm.mjs
- **Model Config**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/main/mlc-chat-config.json
- **Taxonomy**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/data/taxonomy.json
- **Questions**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/data/demo-questions.json

## What it proves
- ✅ **ES Module loading** from GitHub Raw URLs
- ✅ **LLM runtime loading** without npm
- ✅ **JSON fetching** and parsing
- ✅ **Browser-based LLM execution** without npm
- ✅ **CSV export** functionality
- ✅ **No external dependencies** or services

Perfect for proving the concept works in your company's restricted environment!

## Browser LLM (WebLLM) Assets

This repo hosts a tiny browser LLM runtime and model for Chrome DevTools:
- `webllm/web-llm.mjs`
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` (MLC format)

See **LLM_README.md** for upload rules and raw URL checks.
