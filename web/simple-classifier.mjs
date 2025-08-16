export const MODULE_VERSION = "0.1.0";

/**
 * classify(text, taxonomy) -> { category, subcategory, confidence, rationale }
 * A tiny keyword matcher to simulate a model. Safe to run anywhere.
 */
export function classify(text, taxonomy) {
  const t = (text || "").toLowerCase();
  const rules = [
    { words: ["password", "login", "sign in"], cat: "Accounts", sub: "Login/Password" },
    { words: ["kyc", "verify", "verification", "identity"], cat: "Accounts", sub: "KYC/Verification" },
    { words: ["transfer", "withdraw", "deposit"], cat: "Accounts", sub: "Transfers" },
    { words: ["pending", "filled", "cancel", "modify"], cat: "Orders & Trading", sub: "Modify/Cancel" },
    { words: ["place order", "buy", "sell"], cat: "Orders & Trading", sub: "Place Order" },
    { words: ["option"], cat: "Products", sub: "Options" },
    { words: ["etf"], cat: "Products", sub: "ETFs" },
    { words: ["stock", "share"], cat: "Products", sub: "Stocks" }
  ];
  for (const r of rules) {
    if (r.words.some(w => t.includes(w))) {
      if (!taxonomy[r.cat] || !taxonomy[r.cat].includes(r.sub)) {
        return { category: "Other", subcategory: "General", confidence: 0.5, rationale: "Rule not in taxonomy" };
      }
      return {
        category: r.cat,
        subcategory: r.sub,
        confidence: 0.8,
        rationale: `Matched keywords: ${r.words.filter(w => t.includes(w)).join(", ")}`
      };
    }
  }
  return { category: "Other", subcategory: "General", confidence: 0.2, rationale: "No keyword match" };
}
