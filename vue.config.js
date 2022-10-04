const { defineConfig } = require('@vue/cli-service');
const fs = require('fs');

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
  devServer: {
    https: {
      key: fs.readFileSync('./certs/example.com+5-key.pem'),
      cert: fs.readFileSync('./certs/example.com+5.pem'),
    },
    host: 'localhost',
    port: 8080,
  },
});
