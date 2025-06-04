const { defineConfig } = require('@rspack/cli');
const { rspack } = require('@rspack/core');
const HtmlRspackPlugin = require('html-rspack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { resolve } = require('path');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];

module.exports = defineConfig({
  context: __dirname,
  devServer: {
    historyApiFallback: true,
    hot: true,
    liveReload: false,
    compress: true,
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: `${process.env.PUBLIC_PATH_URL}`,
    filename: 'assets/js/[name]-[contenthash].js',
    chunkFilename: 'assets/js/[name]-[contenthash].js',
    assetModuleFilename: 'assets/[name]-[hash][ext]',
  },
  entry: {
    main: './src/main.js',
  },
  resolve: {
    extensions: ['...', '.ts', '.vue'],
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          experimentalInlineMatchResource: true,
        },
      },
      {
        test: /\.(scss|sass)$/,
        loader: 'sass-loader',
        type: 'css',
        options: {
          additionalData: `@import '@weni/unnnic-system/src/assets/scss/unnnic.scss';`,
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name]-[hash][ext]',
        },
      },
      {
        test: /\.(wav|mp3)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/sounds/[name]-[hash][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlRspackPlugin({
      template: './index.html',
      inject: 'head',
      minify: {
        removeComments: false,
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeAttributeQuotes: false,
      },
    }),
    new rspack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      'process.env': JSON.stringify(process.env),
      'import.meta.env': JSON.stringify({
        BASE_URL: process.env.BASE_URL || '/',
      }),
    }),
    new VueLoaderPlugin(),
  ],
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
  experiments: {
    css: true,
  },
});
