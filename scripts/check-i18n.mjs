import { readFileSync } from "node:fs";

const flat = (obj, prefix = "", out = []) => {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v, path, out);
    else out.push(path);
  }
  return out;
};

const enJson = JSON.parse(readFileSync("messages/en.json", "utf8"));
const arJson = JSON.parse(readFileSync("messages/ar.json", "utf8"));
const en = flat(enJson);
const ar = flat(arJson);
const enSet = new Set(en);
const arSet = new Set(ar);

const missingInAr = en.filter((k) => !arSet.has(k));
const missingInEn = ar.filter((k) => !enSet.has(k));

console.log(`en keys: ${en.length}   ar keys: ${ar.length}`);
if (missingInAr.length) { console.log("\nMISSING IN ar.json:"); missingInAr.forEach((k) => console.log("  -", k)); }
if (missingInEn.length) { console.log("\nMISSING IN en.json:"); missingInEn.forEach((k) => console.log("  -", k)); }

const get = (obj, path) => path.split(".").reduce((a, k) => a?.[k], obj);
const tokens = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const bad = en.filter((k) => tokens(get(enJson, k)) !== tokens(get(arJson, k)));
if (bad.length) { console.log("\nPLACEHOLDER MISMATCH:"); bad.forEach((k) => console.log("  -", k, "| en:", tokens(get(enJson, k)), "| ar:", tokens(get(arJson, k)))); }

if (!missingInAr.length && !missingInEn.length && !bad.length) console.log("OK: locales in parity, placeholders match.");
else process.exit(1);
