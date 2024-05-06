const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import '~@weni/unnnic-system/dist/unnnic.css';
          @import '~@weni/unnnic-system/src/assets/scss/unnnic.scss';
        `,
      },
    },
  },
  configureWebpack: {
    resolve: {
      fallback: {
        path: require.resolve('path-browserify'),
      },
    },
  },
  pwa: {
    name: 'Weni Chats',
    themeColor: '#00A49F',
    msTileColor: '#ffffff',
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './src/service-worker.js',
    },

    iconPaths: {
      favicon32: null,
      favicon16: null,
      appleTouchIcon: null,
      maskIcon: null,
      msTileImage: 'logos/weni-512.png',
    },
  },
  publicPath: '/',
});
