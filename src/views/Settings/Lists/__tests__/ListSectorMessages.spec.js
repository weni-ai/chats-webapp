import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import QuickMessageList from '../ListSectorMessages/index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

import Sector from '@/services/api/resources/settings/sector';
import QuickMessage from '@/services/api/resources/chats/quickMessage';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: { update: vi.fn() },
}));

vi.mock('@/services/api/resources/chats/quickMessage', () => ({
  default: {
    delete: vi.fn(),
    deleteBySector: vi.fn(),
    updateBySector: vi.fn(),
    createBySector: vi.fn(),
    getAllBySector: vi.fn(),
  },
}));

vi.spyOn(Sector, 'update').mockResolvedValue({
  status: 200,
  can_use_chat_completion: true,
  can_input_context: true,
  completion_context: true,
});

vi.spyOn(QuickMessage, 'delete').mockResolvedValue({});

const createWrapper = (props = {}) => {
  return mount(QuickMessageList, {
    props: {
      sector: {
        uuid: '1',
        name: 'Test Sector',
      },
      ...props,
    },
    global: {
      plugins: [
        createTestingPinia({
          stubActions: false,
        }),
      ],
    },
  });
};

describe('ListSectorMessages', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;
  let quickMessageStore;

  beforeEach(() => {
    wrapper = createWrapper();
    quickMessageStore = useQuickMessageShared();
    quickMessageStore.quickMessagesShared = [];
  });

  it('renders empty state when there are no messages for the sector', () => {
    expect(wrapper.find('.sector-messages-form__empty').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'UnnnicButton' }).exists()).toBe(true);
  });

  it('opens quick message drawer when create button is clicked', async () => {
    await wrapper.findComponent({ name: 'UnnnicButton' }).trigger('click');
    expect(wrapper.vm.showQuickMessageDrawer).toBe(true);
    expect(wrapper.findComponent({ name: 'QuickMessageDrawer' }).exists()).toBe(
      true,
    );
  });

  it('renders one QuickMessageCard per message for this sector', async () => {
    quickMessageStore.quickMessagesShared = [
      { uuid: 'a', title: 'T1', text: 'Hello', shortcut: 'h', sector: '1' },
      { uuid: 'b', title: 'T2', text: 'Bye', shortcut: 'b', sector: '1' },
    ];
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAllComponents({ name: 'QuickMessageCard' });
    expect(cards.length).toBe(2);
  });

  it('calls openConfigMessageDrawer with message when card emits edit', async () => {
    quickMessageStore.quickMessagesShared = [
      { uuid: 'a', title: 'T1', text: 'Hello', shortcut: 'h', sector: '1' },
    ];
    await wrapper.vm.$nextTick();

    const openSpy = vi.spyOn(wrapper.vm, 'openConfigMessageDrawer');
    const card = wrapper.findComponent({ name: 'QuickMessageCard' });
    await card.vm.$emit(
      'edit',
      quickMessageStore.quickMessagesShared[0],
    );

    expect(openSpy).toHaveBeenCalledWith(
      quickMessageStore.quickMessagesShared[0],
    );
  });

  it('persists sector config when saveSector succeeds', async () => {
    const saveSector = vi.spyOn(wrapper.vm, 'saveSector');
    await saveSector();
    await flushPromises();
    expect(Sector.update).toHaveBeenCalled();
  });
});
