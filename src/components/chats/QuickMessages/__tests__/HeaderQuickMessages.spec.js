import { config, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import i18n from '@/plugins/i18n';
import HeaderQuickMessages from '../HeaderQuickMessages.vue';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const UnnnicButtonStub = {
  name: 'UnnnicButton',
  inheritAttrs: false,
  props: ['iconCenter', 'type', 'size'],
  template:
    '<button type="button" data-testid="header-quick-messages-close" :data-icon-center="iconCenter" @click="$emit(\'click\')" />',
};

const createWrapper = () =>
  mount(HeaderQuickMessages, {
    global: {
      mocks: {
        $t: (key) => (key === 'quick_messages.title' ? 'Quick messages' : key),
      },
      stubs: {
        UnnnicButton: UnnnicButtonStub,
      },
    },
  });

describe('HeaderQuickMessages.vue', () => {
  it('renders the header with data-testid', () => {
    const wrapper = createWrapper();
    const header = wrapper.find('[data-testid="header-quick-messages"]');
    expect(header.exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="header-quick-messages-title"]').exists(),
    ).toBe(true);
  });

  it('renders the quick messages title from i18n', () => {
    const wrapper = createWrapper();
    const paragraph = wrapper.find(
      '[data-testid="header-quick-messages-title"]',
    );
    expect(paragraph.exists()).toBe(true);
    expect(paragraph.text()).toBe('Quick messages');
  });

  it('renders the close button with iconCenter close', () => {
    const wrapper = createWrapper();
    const btn = wrapper.find('[data-testid="header-quick-messages-close"]');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('data-icon-center')).toBe('close');
  });

  it('emits close when the button is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="header-quick-messages-close"]')
      .trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
