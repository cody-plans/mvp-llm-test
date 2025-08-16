export const MODULE_VERSION = "0.1.1";

/**
 * classify(text, taxonomy) -> { category, subcategory, confidence, rationale }
 * A tiny keyword-based dummy classifier to simulate an LLM result.
 * - `taxonomy` is an object like { "Accounts": ["Login/Password", ...], ... }
 * - Returns a safe default (Other/General) if nothing matches.
 */
export function classify(text, taxonomy) {
  const t = String(text || "").toLowerCase();

  // Simple keyword rules (edit to match your domain)
  const rules = [
    { words: ["password", "login", "sign in"],       cat: "Accounts",         sub: "Login/Password" },
    { words: ["kyc", "verify", "verification", "id"],cat: "Accounts",         sub: "KYC/Verification" },
    { words: ["transfer", "withdraw", "deposit"],    cat: "Accounts",         sub: "Transfers" },
    { words: ["pending", "filled", "cancel", "modify"], cat: "Orders & Trading", sub: "Status" },
    { words: ["place order", "buy", "sell"],         cat: "Orders & Trading", sub: "Place Order" },
    { words: ["option"],                              cat: "Products",         sub: "Options" },
    { words: ["etf"],                                 cat: "Products",         sub: "ETFs" },
    { words: ["stock", "share"],                      cat: "Products",         sub: "Stocks" }
  ];

  for (const r of rules) {
    if (r.words.some(w => t.includes(w))) {
      // Validate against provided taxonomy (keeps output consistent)
      const isValid = taxonomy?.[r.cat]?.includes?.(r.sub);
      if (!isValid) {
        return {
          category: "Other",
          subcategory: "General",
          confidence: 0.5,
          rationale: `Matched rule but not found in taxonomy: ${r.cat} / ${r.sub}`
        };
      }
      return {
        category: r.cat,
        subcategory: r.sub,
        confidence: 0.8,
        rationale: `Matched keywords: ${r.words.filter(w => t.includes(w)).join(", ")}`
      };
    }
  }

  return {
    category: "Other",
    subcategory: "General",
    confidence: 0.2,
    rationale: "No keyword match"
  };
}
