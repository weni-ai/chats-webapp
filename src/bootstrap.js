// Async boundary for Module Federation.
//
// The entry must be deferred via a dynamic import so the federation runtime can
// negotiate shared, non-eager singletons (`pinia`, `vue-router`) before any
// module synchronously requires them. Without this boundary, `loadShareSync`
// throws RUNTIME-006 (`The function should not be called unless you set
// eager:true`) and the chats `remoteEntry.js` fails to evaluate (RUNTIME-008).
import('./main');
