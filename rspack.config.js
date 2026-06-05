const { defineConfig } = require('@rspack/cli');
const { rspack } = require('@rspack/core');
const HtmlRspackPlugin = require('html-rspack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { resolve } = require('path');
const path = require('path');
const dotenv = require('dotenv');
const pkg = require('./package.json');

dotenv.config();

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];

// When the connect host URL is configured we wire chats as a Module Federation
// remote that can also consume `connect/sharedStore`. When it's missing
// (standalone `npm run dev`, CI, unit builds) we resolve that import to a local
// stub so the bundle still compiles without a live host.
const connectUrl = process.env.MODULE_FEDERATION_CONNECT_URL;

module.exports = defineConfig({
  context: __dirname,
  devServer: {
    historyApiFallback: true,
    hot: true,
    liveReload: false,
    compress: true,
    headers: {
      // Module Federation cross-origin: the connect host fetches
      // `remoteEntry.js` from this dev server during local federation testing.
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: `${process.env.PUBLIC_PATH_URL}/`,
    filename: 'assets/js/[name]-[contenthash].js',
    chunkFilename: 'assets/js/[name]-[contenthash].js',
    assetModuleFilename: 'assets/[name]-[hash][ext]',
  },
  entry: {
    // Deferred async boundary (see src/bootstrap.js) so Module Federation can
    // resolve non-eager shared singletons (pinia, vue-router) before any module
    // synchronously requires them. `./main` stays the exposed remote entry.
    main: './src/bootstrap.js',
  },
  resolve: {
    extensions: ['...', '.ts', '.vue'],
    alias: {
      '@': resolve(__dirname, 'src'),
      ...(connectUrl
        ? {}
        : {
            'connect/sharedStore': resolve(
              __dirname,
              'src/stubs/connectSharedStore.js',
            ),
          }),
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
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
              env: { targets },
            },
          },
        ],
      },
      {
        test: /\.(scss|sass)$/,
        use: [
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: `@import '@weni/unnnic-system/src/assets/scss/unnnic.scss';`,
            },
          },
        ],
        type: 'css',
      },
      {
        test: /\.css$/,
        use: ['postcss-loader'],
        type: 'css',
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
    new rspack.container.ModuleFederationPlugin({
      name: 'chats',
      filename: 'remoteEntry.js',
      exposes: {
        './main': './src/main.js',
        './locales/pt_br': './src/locales/pt_br.json',
        './locales/en': './src/locales/en.json',
        './locales/es': './src/locales/es.json',
      },
      ...(connectUrl
        ? {
            remotes: {
              connect: `connect@${connectUrl}/remoteEntry.js`,
            },
          }
        : {}),
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '^3.0.0',
          eager: true,
        },
        'vue-i18n': {
          singleton: true,
          requiredVersion: pkg.dependencies['vue-i18n'],
          eager: true,
        },
        pinia: {
          singleton: true,
          requiredVersion: pkg.dependencies['pinia'],
          eager: true,
        },
        'vue-router': {
          singleton: true,
          requiredVersion: pkg.dependencies['vue-router'],
        },
      },
    }),
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
