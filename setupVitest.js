import { config } from '@vue/test-utils';
import i18n from '@/plugins/i18n.js';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';

config.global.plugins = [i18n, UnnnicSystemPlugin];
config.global.mocks = {
  $t: (msg) => msg,
};
