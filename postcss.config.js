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
 * `prefixRootTags: true` rewrites `:root`, `html`, and `body` selectors —
 * needed because both `src/styles/reset.scss` / `global.scss` and unnnic's
 * `dist/style.css` rely on those.
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

    postcssPrefixwrap('.chats-webapp', {
      prefixRootTags: true,
    }),
  ],
};
