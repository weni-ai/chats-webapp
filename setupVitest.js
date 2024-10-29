import { config } from '@vue/test-utils';
import i18n from '@/plugins/i18n.js';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

config.global.plugins = [i18n, UnnnicSystemPlugin];
config.global.mocks = {
  $t: (msg) => msg,
};
