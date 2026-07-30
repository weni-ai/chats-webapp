import * as Sentry from '@sentry/vue';
import env from './env';

/**
 * Strip any trailing slash from a URL-like string. `window.location.origin`
 * is always slash-less, but `PUBLIC_PATH_URL` from `.env` frequently arrives
 * with a trailing slash (it's also what `<base>`-style configs expect). We
 * normalize both sides before comparing so the predicate stays stable
 * regardless of how the operator wrote the value.
 */
function trimTrailingSlash(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\/+$/u, '');
}

/**
 * True when the app is being consumed as a Module Federation remote by a host
 * (Connect / weni-webapp). False when the bundle is served from its own origin
 * (standalone dev, cross-origin iframe inside Connect, or mobile redirect).
 *
 * Detection compares the live browser origin to the build-time
 * `PUBLIC_PATH_URL` baked into the bundle. When the host loads
 * `remoteEntry.js`, code executes under the host origin, so the two differ.
 *
 * If `PUBLIC_PATH_URL` is not set (local dev, unit tests, CI builds without
 * federation env vars) we default to standalone — federation is opt-in.
 */
const PUBLIC_PATH_URL = trimTrailingSlash(env('PUBLIC_PATH_URL'));
const CURRENT_ORIGIN = trimTrailingSlash(window.location.origin);

export const isFederatedModule =
  !!PUBLIC_PATH_URL && CURRENT_ORIGIN !== PUBLIC_PATH_URL;

/**
 * Safely import a federated module. Returns the module namespace (resolving
 * `default` if present) or an empty object on failure / when not federated.
 *
 * Mirrors the agent-builder pattern so that consumers can destructure with a
 * stable shape even when the remote is unavailable.
 */
export async function safeImport(
  importFn: () => Promise<any>,
  importPath: string,
): Promise<any> {
  // Skip the remote fetch entirely when standalone: there is no host to
  // negotiate with, so the result would be discarded anyway. Matches the
  // insights-webapp pattern.
  if (!isFederatedModule) return {};

  try {
    const module = await importFn();
    return module?.default || module || {};
  } catch (error: any) {
    console.error(
      `[Module Federation] ${importPath} unavailable:`,
      error?.message,
    );

    if (isFederatedModule) {
      Sentry.captureException(error, {
        tags: { module_federation: true, import_path: importPath },
      });
    }

    return {};
  }
}
