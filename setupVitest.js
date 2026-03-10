import { config } from '@vue/test-utils';
import i18n from '@/plugins/i18n.js';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';
import { vi } from 'vitest';
import lodash from 'lodash';
import Unnnic from '@weni/unnnic-system';

// Mock matchMedia
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

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}
global.IntersectionObserver = IntersectionObserverMock;

// Mock Unnnic teleport components
const unnnicDrawerStub = {
  name: 'UnnnicDrawerStub',
  props: {
    modelValue: { type: Boolean, default: true },
    primaryButtonText: String,
    secondaryButtonText: String,
    disabledPrimaryButton: Boolean,
    disabledSecondaryButton: Boolean,
    loadingPrimaryButton: Boolean,
    title: String,
    size: String,
  },
  emits: Unnnic?.unnnicDrawer?.emits || [
    'close',
    'primary-button-click',
    'secondary-button-click',
  ],
  methods: {
    close() {
      this.$emit('close');
    },
  },
  template: `
    <div v-if="modelValue" v-bind="$attrs">
      <slot name="title" />
      <slot name="content" />
      <button 
        data-testid="primary-button" 
        @click="$emit('primary-button-click')"
        :disabled="disabledPrimaryButton"
      >
        {{ primaryButtonText }}
      </button>
      <button 
        data-testid="secondary-button" 
        @click="$emit('secondary-button-click')"
        :disabled="disabledSecondaryButton"
      >
        {{ secondaryButtonText }}
      </button>
    </div>
  `,
};

const unnnicDrawerNextStub = {
  name: 'UnnnicDrawerNextStub',
  inheritAttrs: false,
  props: Unnnic?.unnnicDrawerNext?.props,
  emits: Unnnic?.unnnicDrawerNext?.emits,
  template: `
    <div v-bind="$attrs">
      <slot />
    </div>
  `,
};

const unnnicModalDialogStub = {
  name: 'UnnnicModalDialogStub',
  inheritAttrs: false,
  props: Unnnic?.unnnicModalDialog?.props,
  emits: Unnnic?.unnnicModalDialog?.emits,
  template: `
    <div v-bind="$attrs">
      <slot name="leftSidebar" />
      <slot />
      <slot name="footer" />
    </div>
  `,
};

const unnnicTooltipStub = {
  name: 'UnnnicToolTipStub',
  inheritAttrs: false,
  props: Unnnic?.unnnicToolTip?.props,
  emits: Unnnic?.unnnicToolTip?.emits,
  template: `<div><slot /></div>`,
};

const unnnicDialogStub = {
  name: 'UnnnicDialog',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: false },
    ...(Unnnic?.unnnicDialog?.props || {}),
  },
  emits: Unnnic?.unnnicDialog?.emits || ['update:open'],
  template: `
    <div v-if="open" v-bind="$attrs" :data-testid="$attrs['data-testid'] || 'modal-dialog'">
      <button type="button" class="unnnic-dialog-close" @click="$emit('update:open', false)" />
      <slot />
    </div>
  `,
};

const unnnicDialogContentStub = {
  name: 'UnnnicDialogContentStub',
  inheritAttrs: false,
  props: {
    size: String,
    ...(Unnnic?.unnnicDialogContent?.props || {}),
  },
  emits: Unnnic?.unnnicDialogContent?.emits,
  template: '<div v-bind="$attrs"><slot /></div>',
};

const unnnicDialogHeaderStub = {
  name: 'UnnnicDialogHeaderStub',
  inheritAttrs: false,
  props: Unnnic?.unnnicDialogHeader?.props || {},
  emits: Unnnic?.unnnicDialogHeader?.emits,
  template: '<div v-bind="$attrs"><slot /></div>',
};

const unnnicDialogTitleStub = {
  name: 'UnnnicDialogTitleStub',
  inheritAttrs: false,
  props: Unnnic?.unnnicDialogTitle?.props || {},
  emits: Unnnic?.unnnicDialogTitle?.emits,
  template: '<div v-bind="$attrs"><slot /></div>',
};

const unnnicDialogFooterStub = {
  name: 'UnnnicDialogFooterStub',
  inheritAttrs: false,
  props: Unnnic?.unnnicDialogFooter?.props || {},
  emits: Unnnic?.unnnicDialogFooter?.emits,
  template: '<div v-bind="$attrs"><slot /></div>',
};

config.global.plugins = [i18n, UnnnicSystemPlugin];
config.global.mocks = {
  $t: (msg) => msg,
};
config.global.stubs = {
  ...(config.global.stubs || {}),
  teleport: {
    template: `<div><slot /></div>`,
  },
  UnnnicModalDialog: unnnicModalDialogStub,
  UnnnicToolTip: unnnicTooltipStub,
  UnnnicDrawer: unnnicDrawerStub,
  UnnnicDrawerNext: unnnicDrawerNextStub,
  UnnnicDialog: unnnicDialogStub,
  UnnnicDialogContent: unnnicDialogContentStub,
  UnnnicDialogHeader: unnnicDialogHeaderStub,
  UnnnicDialogTitle: unnnicDialogTitleStub,
  UnnnicDialogFooter: unnnicDialogFooterStub,
};

// Mock lodash.debounce
vi.spyOn(lodash, 'debounce').mockImplementation((fn) => fn);
