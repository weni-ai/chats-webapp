/**
 * Dev-only loader: auto-registers Pinia HMR for store modules.
 *
 * Finds `export const useX = defineStore(...)` and appends
 * `registerStoreHMR(useX, import.meta.webpackHot)` so stores don't need
 * manual boilerplate (easy to forget on new stores).
 *
 * Runs as a pre-loader on the original TS/JS source before SWC.
 */
module.exports = function piniaHmrLoader(source) {
  if (this.cacheable) {
    this.cacheable();
  }

  if (!/defineStore\s*\(/.test(source)) {
    return source;
  }

  // Drop manual registration if present (idempotent / migration-safe).
  let code = source
    .replace(
      /import\s*\{\s*registerStoreHMR\s*\}\s*from\s*['"]@\/utils\/hmr['"];?\r?\n?/g,
      '',
    )
    .replace(
      /registerStoreHMR\s*\(\s*\w+\s*,\s*import\.meta\.webpackHot\s*\)\s*;?\r?\n?/g,
      '',
    );

  const storeNames = [
    ...code.matchAll(/export\s+const\s+(\w+)\s*=\s*defineStore\s*\(/g),
  ].map((match) => match[1]);

  if (!storeNames.length) {
    return code;
  }

  const importStatement = `import { registerStoreHMR } from '@/utils/hmr';\n`;
  const registrations = storeNames
    .map((name) => `registerStoreHMR(${name}, import.meta.webpackHot);`)
    .join('\n');

  return `${importStatement}${code}\n${registrations}\n`;
};
