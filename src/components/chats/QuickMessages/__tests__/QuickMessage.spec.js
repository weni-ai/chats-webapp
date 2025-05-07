import { expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import isMobile from 'is-mobile';

import QuickMessages from '../index.vue';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

vi.mock('is-mobile');

isMobile.mockResolvedValue(false);

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

  it('should trigger createQuickMessage when creating a new message and show form', async () => {
    quickMessagesStore.create = vi.fn();

    await wrapper.setData({ isMobile: false });

    const button = wrapper.find('[data-testid="quick-message-new-button"]');

    await button.trigger('click');

    expect(wrapper.vm.quickMessageToEdit).toStrictEqual(
      wrapper.vm.emptyQuickMessage,
    );

    const quickMessageForm = await wrapper.find(
      '[data-testid="quick-messages-form"]',
    );

    expect(quickMessageForm.exists()).toBe(true);
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
});
