import { expect, vi, describe, it, beforeEach } from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import isMobile from 'is-mobile';

import QuickMessages from '../index.vue';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

import UnnnicSystem from '@/plugins/UnnnicSystem';
import { createI18n } from 'vue-i18n';

vi.mock('is-mobile');

isMobile.mockReturnValue(false);

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {},
  },
  fallbackWarn: false,
  missingWarn: false,
});

config.global.plugins = [i18n, UnnnicSystem];
config.global.mocks = {
  $t: (key) => key,
};

const defaultStubs = [
  'AsideSlotTemplate',
  'AsideSlotTemplateSection',
  'QuickMessagesList',
  'QuickMessageForm',
  'HeaderQuickMessages',
  'UnnnicButton',
  'UnnnicModal',
  'UnnnicDisclaimer',
];

describe('QuickMessages.vue', () => {
  let personalStore;
  let sharedStore;
  let loadPersonalSpy;
  let loadSharedSpy;

  const mountComponent = (options = {}) => {
    return mount(QuickMessages, {
      global: {
        components: {
          AsideSlotTemplate,
          AsideSlotTemplateSection,
        },
        stubs: defaultStubs,
        mocks: {
          $t: (key) => key,
        },
        ...options.global,
      },
      ...options,
    });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    personalStore = useQuickMessages();
    sharedStore = useQuickMessageShared();
    loadPersonalSpy = vi
      .spyOn(personalStore, 'loadAllV2IfNeeded')
      .mockResolvedValue();
    loadSharedSpy = vi
      .spyOn(sharedStore, 'getByProjectNextPage')
      .mockResolvedValue();
  });

  it('should emit select-quick-message event when not on mobile', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.setData({ isMobile: false });

    const quickMessage = {
      uuid: '123',
      title: 'Quick Message',
      text: 'Some text',
      shortcut: 'Ctrl+Q',
    };
    await wrapper.vm.selectQuickMessage(quickMessage);

    expect(wrapper.emitted()['select-quick-message']).toBeTruthy();
    expect(wrapper.emitted()['select-quick-message'][0]).toEqual([
      quickMessage,
    ]);
  });

  it('lazy loads personal and project shared messages on open', async () => {
    mountComponent();
    await flushPromises();

    expect(loadPersonalSpy).toHaveBeenCalled();
    expect(loadSharedSpy).toHaveBeenCalled();
  });
});
