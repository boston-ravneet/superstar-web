#!/usr/bin/env node
/**
 * Creates .dev.vars from the example only if it does not exist yet.
 * Safe to run anytime — never overwrites an existing .dev.vars.
 */
import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const target = resolve(root, ".dev.vars");
const example = resolve(root, ".dev.vars.example");

if (existsSync(target)) {
  console.log("[dev:init] .dev.vars already exists — left unchanged.");
  process.exit(0);
}

if (!existsSync(example)) {
  console.error("[dev:init] Missing .dev.vars.example");
  process.exit(1);
}

copyFileSync(example, target);
console.log("[dev:init] Created .dev.vars from .dev.vars.example");
console.log("[dev:init] Add GEMINI_API_KEY to .dev.vars once, then run: npm run dev");
