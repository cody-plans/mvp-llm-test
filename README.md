# MVP – Chrome Snippet Dummy Classifier (No npm)

This repo proves our company environment can:
1) Load an ES module and JSON from GitHub Raw,
2) Run a tiny dummy "classifier" in the browser,
3) Export a CSV – all without npm/Hugging Face/servers.

## Files
- `web/simple-classifier.mjs` – keyword-based dummy classifier.
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
      
      // Validate module exports
      if (!module.classify || typeof module.classify !== 'function') {
        throw new Error('Module missing required classify function');
      }
      if (!module.MODULE_VERSION) {
        throw new Error('Module missing MODULE_VERSION');
      }
      
      return module;
    } catch (error) {
      console.error(`[MVP] ❌ Failed to import ${pathToESM}:`, error);
      throw error;
    }
  }

  try {
    console.time("[MVP] total");
    
    // 1) Load the dummy classifier module
    const mod = await importFromGitHub("web/simple-classifier.mjs");
    console.log("[MVP] Module loaded, version =", mod.MODULE_VERSION);

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

    // 4) Run dummy classification
    const results = questions.map(q => {
      const r = mod.classify(q, taxonomy);
      return { question: q, ...r };
    });
    console.table(results);

    // 5) Generate and download CSV
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

- **Module**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/web/simple-classifier.mjs
- **Taxonomy**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/data/taxonomy.json
- **Questions**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/data/demo-questions.json

## What it proves
- ✅ **ES Module loading** from GitHub Raw URLs
- ✅ **JSON fetching** and parsing
- ✅ **Browser-based execution** without npm
- ✅ **CSV export** functionality
- ✅ **No external dependencies** or services

Perfect for proving the concept works in your company's restricted environment!

## Browser LLM (WebLLM) Assets

This repo can host a tiny browser LLM runtime and model for Chrome DevTools:
- `webllm/web-llm.mjs`
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` (MLC format)

See **LLM_README.md** for upload rules and raw URL checks.
