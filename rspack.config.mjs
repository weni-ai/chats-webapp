import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { defineWeniConfig } from '@weni/rspack-config';
import pkg from './package.json' with { type: 'json' };

dotenv.config();

const connectUrl = process.env.MODULE_FEDERATION_CONNECT_URL;

export default defineWeniConfig({
  dirname: import.meta.dirname,
  pkg,
  port: 8080,
  entry: './src/bootstrap.js',
  postcss: {
    prefix: '.chats-webapp',
    prefixTransform: (selector, prefix) => {
      if (selector.startsWith('.dark')) {
        return `${prefix} ${selector}, ${prefix}${selector}`;
      }
      return `${prefix} ${selector}`;
    },
  },
  federation: {
    name: 'chats',
    exposes: {
      './main': './src/main.js',
    },
    remotes: {
      connect: connectUrl,
    },
  },
  aliases: connectUrl
    ? {}
    : {
        'connect/sharedStore': resolve(
          import.meta.dirname,
          'src/stubs/connectSharedStore.js',
        ),
      },
  override: (config) => {
    config.module.rules = config.module.rules.map((rule) => {
      if (
        rule &&
        typeof rule === 'object' &&
        'test' in rule &&
        String(rule.test).includes('wav')
      ) {
        return {
          test: /\.(wav|mp3)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/sounds/[name]-[hash][ext]',
          },
        };
      }
      return rule;
    });
    return config;
  },
});
