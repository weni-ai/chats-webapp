import { acceptHMRUpdate, getActivePinia, type StoreDefinition } from 'pinia';

type WebpackHotModule = {
  data?: Record<string, unknown>;
  accept: (callback?: (err?: Error) => void) => void;
  dispose: (callback: (data: Record<string, unknown>) => void) => void;
  invalidate?: () => void;
};

/**
 * Enables hot module replacement for a Pinia store under Webpack/Rspack.
 *
 * Pinia's `acceptHMRUpdate` is written for Vite, where
 * `import.meta.hot.accept(cb)` calls `cb(newModule)`. Webpack/Rspack only
 * self-accepts and re-executes the module — the accept callback is an error
 * handler and never receives exports. Without a manual patch, edits are
 * accepted silently and the live store keeps the old getters/actions.
 *
 * Do not call this from store files. In development, `build/pinia-hmr-loader.js`
 * injects `registerStoreHMR(useStore, import.meta.webpackHot)` for every
 * `export const … = defineStore(...)` under `src/store/modules`.
 */
export function registerStoreHMR(
  useStore: StoreDefinition<any, any, any, any>,
  hot: WebpackHotModule | undefined,
) {
  if (!hot) return;

  hot.accept();

  hot.dispose((data) => {
    data.pinia = getActivePinia() ?? (useStore as any)._pinia;
  });

  const pinia = getActivePinia() ?? (useStore as any)._pinia ?? hot.data?.pinia;
  if (!pinia) return;

  // Feed the re-executed store definition into Pinia's Vite-oriented updater.
  acceptHMRUpdate(useStore, { data: { pinia }, invalidate: hot.invalidate })({
    [useStore.$id]: useStore,
  });
}
