# WebLLM Browser Integration Demo

A demonstration of running WebLLM models in the browser without npm installations.

## Files
- `webllm/web-llm.mjs` – WebLLM runtime engine
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` – MLC format model files
- `src/taxonomyStore.js` – Data store utilities
- `data/sample-taxonomy.csv` – Sample data template
- `tools/import_taxonomy_snippet.js` – Data import utilities

## Usage

### Step 1: Import Data
1. Open Chrome DevTools → Sources → Snippets
2. Run `tools/import_taxonomy_snippet.js`
3. Select a CSV file when prompted

### Step 2: Run Demo
1. Create a new snippet in DevTools
2. Use the example code below, updating the repository path

```js
const REPO = "<your-github-username>/mvp-llm-test";
const BRANCH = "main";

(async () => {
  const GH_RAW = (path) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
  
  async function importFromGitHub(pathToESM) {
    const res = await fetch(GH_RAW(pathToESM));
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const code = await res.text();
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    return import(url);
  }

  try {
    console.time("[Demo] total");
    
    // Load components
    const taxonomyStore = await importFromGitHub("src/taxonomyStore.js");
    const webllm = await importFromGitHub("webllm/web-llm.mjs");
    
    // Initialize and run demo
    const availableGroups = await taxonomyStore.getAvailableGroups();
    if (availableGroups.length === 0) {
      throw new Error("No data found. Please run the import script first.");
    }

    const group = availableGroups[0];
    const taxonomy = await taxonomyStore.loadActiveTaxonomy(group);
    
    if (!taxonomy) {
      throw new Error("Failed to load data");
    }

    console.log(`Loaded data: v${taxonomy.version} (${taxonomy.categories.length} items)`);

    // Initialize WebLLM
    const engine = await webllm.CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
      appConfig: {
        model_list: [{
          model: GH_RAW("models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/main"),
          model_id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"
        }]
      }
    });
    console.log("WebLLM engine ready");

    // Run LLM classification
    const sampleQuestions = [
      "How do I reset my web password?",
      "I need an OTP for my transaction"
    ];

    const results = [];
    for (const q of sampleQuestions) {
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

    // Generate and download CSV
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

    console.timeEnd("[Demo] total");
    console.log("[Demo] ✅ All good. CSV downloaded.");
    
  } catch (error) {
    console.error("[Demo] ❌ Critical error:", error);
    console.error("[Demo] Stack trace:", error.stack);
  }
})();
```

## Raw URLs for Testing
These URLs can be accessed directly to verify the files are reachable:

- **WebLLM Runtime**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/webllm/web-llm.mjs
- **Model Config**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/resolve/main/mlc-chat-config.json
- **Data Store**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/src/taxonomyStore.js
- **Sample Data**: https://raw.githubusercontent.com/cody-plans/mvp-llm-test/main/data/sample-taxonomy.csv

## What it demonstrates
- ✅ **ES Module loading** from GitHub Raw URLs
- ✅ **WebLLM runtime** without npm
- ✅ **Browser-based execution** without external services
- ✅ **Data management** via IndexedDB
- ✅ **No external dependencies**

## WebLLM Assets

This repo hosts browser LLM runtime and model files:
- `webllm/web-llm.mjs`
- `models/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/` (MLC format)

See **LLM_README.md** for technical details.
