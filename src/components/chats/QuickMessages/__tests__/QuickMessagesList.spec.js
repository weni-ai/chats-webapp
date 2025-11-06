import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

import QuickMessagesList from '@/components/chats/QuickMessages/QuickMessagesList.vue';

describe('QuickMessagesList Component', () => {
  let wrapper;
  let quickMessagesStore, sharedMessagesStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    quickMessagesStore = useQuickMessages();
    sharedMessagesStore = useQuickMessageShared();

    wrapper = mount(QuickMessagesList, {
      global: { stubs: { QuickMessageCard: true } },
    });
  });

  it('renders without quick messages correctly', async () => {
    await wrapper.setProps({ withHandlers: true });
    expect(
      wrapper.find('[data-testid="quick-messages-list-without"]').exists(),
    ).toBe(true);
  });

  it('emits select-quick-message event', async () => {
    const message = { uuid: '123', text: 'Hello' };
    await wrapper.vm.emitSelectQuickMessage(message);
    expect(wrapper.emitted('select-quick-message')[0]).toEqual([message]);
  });

  it('updates isEmpty prop when quick messages change', async () => {
    await wrapper.setData({ quickMessages: [], quickMessagesShared: [] });
    expect(wrapper.emitted('update:isEmpty')).toBeTruthy();
  });

  it('renders shared quick messages from store', async () => {
    sharedMessagesStore.quickMessagesShared = [
      { uuid: '2', text: 'Shared message', title: 'Shared message' },
    ];

    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="quick-messages-lits-shared"]').exists(),
    ).toBe(true);

    expect(wrapper.text()).toContain('Your quick messages');

    expect(wrapper.text()).toContain('Shared quick messages');

    const shared = wrapper.findAll('[data-testid="quick-message-shared-card"]');

    expect(shared.length).toBe(1);
  });

  it('renders personal quick messages from store', async () => {
    quickMessagesStore.quickMessages = [
      { uuid: '1', text: 'Personal message', title: 'Personal message' },
      { uuid: '2', text: 'Personal message', title: 'Personal message' },
    ];

    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="quick-messages-lits-personals"]').exists(),
    ).toBe(true);

    expect(wrapper.text()).toContain('Your quick messages');

    const personal = wrapper.findAll(
      '[data-testid="quick-message-personal-card"]',
    );

    expect(personal.length).toBe(2);
  });

  it('emits edit-quick-message event correctly', async () => {
    quickMessagesStore.quickMessages = [{ uuid: '1', text: 'Test message' }];

    await wrapper.vm.$nextTick();

    await wrapper.vm.emitEditQuickMessage({ uuid: '1', text: 'Test message' });
    expect(wrapper.emitted('edit-quick-message')).toBeTruthy();
  });

  it('emits delete-quick-message event correctly', async () => {
    quickMessagesStore.quickMessages = [{ uuid: '1', text: 'Test message' }];

    await wrapper.vm.$nextTick();

    await wrapper.vm.emitDeleteQuickMessage({
      uuid: '1',
      text: 'Test message',
    });
    expect(wrapper.emitted('delete-quick-message')).toBeTruthy();
  });
});
