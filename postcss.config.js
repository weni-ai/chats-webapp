const postcssPrefixwrap = require('postcss-prefixwrap');

/**
 * PostCSS pipeline for chats-webapp.
 *
 * In federation mode the chats bundle is mounted inside the connect host
 * document. To prevent class-name collisions and global selector bleed-through
 * we wrap every CSS rule under `.chats-webapp` (the class added to the mount
 * container in `src/main.js`).
 *
 * We deliberately do NOT enable `prefixRootTags`: in v1.58.0 it emits
 * `prefix + " ." + selector`, producing invalid CSS like `.chats-webapp .:root`
 * which the browser drops — including the entire unnnic theme block. Without
 * that flag `:root` is REPLACED with the prefix, which is what we want.
 *
 * `html`, `body`, and the universal `*` selectors are left alone via
 * `ignoredSelectors` so the baseline rules in `src/styles/{global,reset}.scss`
 * keep working at the document level (see comment on the option below).
 */
module.exports = {
  plugins: [
    postcssPrefixwrap('.chats-webapp', {
      prefixTransform: (selector, prefix) => {
        if (selector.startsWith('.dark')) {
          return `${prefix} ${selector}, ${prefix}${selector}`;
        }
        return `${prefix} ${selector}`;
      },
    }),
  ],
};
