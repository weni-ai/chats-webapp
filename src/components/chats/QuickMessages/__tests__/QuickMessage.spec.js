import { expect, vi } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import isMobile from 'is-mobile';

import QuickMessages from '../index.vue';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

import UnnnicSystem from '@/plugins/UnnnicSystem';
import { createI18n } from 'vue-i18n';

vi.mock('is-mobile');

isMobile.mockResolvedValue(false);

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

describe('QuickMessages.vue', () => {
  let quickMessagesStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    quickMessagesStore = useQuickMessages();
    wrapper = mount(QuickMessages, {
      global: {
        components: {
          AsideSlotTemplate,
          AsideSlotTemplateSection,
        },
        stubs: {
          QuickMessagesList: true,
          QuickMessageForm: true,
        },
      },
    });
  });

  it('should emit select-quick-message event when not on mobile', async () => {
    const wrapper = mount(QuickMessages, {
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: [
          'AsideSlotTemplate',
          'AsideSlotTemplateSection',
          'QuickMessagesList',
          'QuickMessageForm',
          'UnnnicButton',
          'UnnnicModal',
        ],
      },
    });

    // Mocking isMobile for desktop view
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

  it('lazy loads personal and project shared messages on open when v2 flag is on', () => {
    setActivePinia(createPinia());

    const featureFlagStore = useFeatureFlag();
    featureFlagStore.featureFlags = {
      active_features: ['weniChatsQuickMessagesV2'],
    };

    const personalStore = useQuickMessages();
    const sharedStore = useQuickMessageShared();
    const loadPersonalSpy = vi
      .spyOn(personalStore, 'loadAllV2IfNeeded')
      .mockResolvedValue();
    const loadSharedSpy = vi
      .spyOn(sharedStore, 'getByProjectNextPage')
      .mockResolvedValue();

    mount(QuickMessages, {
      global: {
        stubs: [
          'AsideSlotTemplate',
          'AsideSlotTemplateSection',
          'QuickMessagesList',
          'QuickMessageForm',
          'UnnnicButton',
          'UnnnicModal',
        ],
      },
    });

    expect(loadPersonalSpy).toHaveBeenCalled();
    expect(loadSharedSpy).toHaveBeenCalled();
  });
});
