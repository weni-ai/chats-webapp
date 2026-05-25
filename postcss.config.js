const postcssPresetEnv = require('postcss-preset-env');
const postcssPrefixwrap = require('postcss-prefixwrap');

/**
 * PostCSS pipeline for chats-webapp.
 *
 * In federation mode the chats bundle is mounted inside the connect host
 * document. To prevent class-name collisions and global selector bleed-through
 * we wrap every CSS rule under `.chats-webapp` (the class added to the mount
 * container in `src/main.js`).
 *
 * NOTE on `:root`, `html`, `body`:
 * With no `prefixRootTags`, the plugin REPLACES `:root` / `html` / `body`
 * with the prefix selector, so `:root { --vars }` becomes
 * `.chats-webapp { --vars }` — exactly what we want for federation, where the
 * host already owns `<html>` / `<body>`. We deliberately do NOT use
 * `prefixRootTags: true`: in v1.58.0 it emits `prefix + " ." + selector`,
 * producing the invalid CSS `.chats-webapp .:root { ... }` and dropping the
 * entire unnnic theme block. The baseline `html, body { height: 100% }` for
 * standalone mode is provided directly in `index.html` (the host owns the
 * document in federation mode, so it doesn't need that fallback).
 */
module.exports = {
  plugins: [
    postcssPresetEnv({
      stage: 2,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'color-function': true,
      },
    }),

    postcssPrefixwrap('.chats-webapp'),
  ],
};
