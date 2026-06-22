#!/usr/bin/env node
/**
 * Warns if GEMINI_API_KEY is missing — does not block dev server.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const devVars = resolve(process.cwd(), ".dev.vars");

if (!existsSync(devVars)) {
  console.warn(
    "\n⚠️  No .dev.vars file. Run once: npm run dev:init\n   Then add GEMINI_API_KEY to .dev.vars\n",
  );
  process.exit(0);
}

const content = readFileSync(devVars, "utf8");
const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
const key = match?.[1]?.trim() ?? "";

if (!key) {
  console.warn(
    "\n⚠️  GEMINI_API_KEY is empty in .dev.vars — AI page design will use local fallback.\n" +
      "   Add your key to .dev.vars and restart the dev server.\n" +
      "   Do NOT run: cp .dev.vars.example .dev.vars  (that wipes your keys)\n",
  );
} else if (!key.startsWith("AIza") && !key.startsWith("AQ.")) {
  console.warn(
    "\n⚠️  GEMINI_API_KEY format looks wrong (expected AIza… or AQ.…).\n" +
      "   Create a key at https://aistudio.google.com/apikey\n",
  );
}
