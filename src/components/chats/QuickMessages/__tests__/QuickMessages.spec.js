import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQuickMessages } from '@/store/modules/chats/quickMessages';

import QuickMessages from '../index.vue';

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

vi.mock('is-mobile', () => ({
  default: vi.fn(() => false),
}));

import isMobile from 'is-mobile';

const quickMessageFixture = {
  uuid: 'qm-1',
  title: 'Title',
  text: 'Body',
  shortcut: 'hi',
};

const createWrapper = (options = {}) => {
  const { isMobileValue = false } = options;

  isMobile.mockReturnValue(isMobileValue);

  const pinia = createPinia();
  setActivePinia(pinia);

  const quickMessagesStore = useQuickMessages();
  vi.spyOn(quickMessagesStore, 'create').mockResolvedValue(undefined);
  vi.spyOn(quickMessagesStore, 'update').mockResolvedValue(undefined);
  vi.spyOn(quickMessagesStore, 'delete').mockResolvedValue(undefined);

  const wrapper = mount(QuickMessages, {
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        AsideSlotTemplate: {
          template:
            '<div data-testid="quick-messages-aside-root"><slot /><slot name="modals" /></div>',
        },
        AsideSlotTemplateSection: {
          template:
            '<div data-testid="quick-messages-aside-section"><slot /></div>',
        },
        HeaderQuickMessages: true,
        UnnnicDisclaimer: true,
        QuickMessagesList: true,
        ModalQuickMessages: true,
        ModalDeleteQuickMessage: true,
      },
    },
  });

  return { wrapper, quickMessagesStore };
};

describe('QuickMessages (index.vue)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits select-quick-message when not on mobile', async () => {
    const { wrapper } = createWrapper({ isMobileValue: false });

    await wrapper.vm.selectQuickMessage(quickMessageFixture);

    expect(wrapper.emitted('select-quick-message')).toBeTruthy();
    expect(wrapper.emitted('select-quick-message')[0]).toEqual([
      quickMessageFixture,
    ]);
  });

  it('sets quickMessageToEdit instead of emitting when on mobile', async () => {
    const { wrapper } = createWrapper({ isMobileValue: true });

    await wrapper.vm.selectQuickMessage(quickMessageFixture);

    expect(wrapper.emitted('select-quick-message')).toBeFalsy();
    expect(wrapper.vm.quickMessageToEdit).toEqual(quickMessageFixture);
  });

  it('openQuickMessageCreation sets an empty quick message for create flow', () => {
    const { wrapper } = createWrapper();

    wrapper.vm.openQuickMessageCreation();

    expect(wrapper.vm.quickMessageToEdit).toEqual({
      title: '',
      text: '',
      shortcut: '',
    });
    expect(wrapper.vm.isCreating).toBe(true);
    expect(wrapper.vm.isEditing).toBeFalsy();
  });

  it('createQuickMessage calls store create and clears quickMessageToEdit', async () => {
    const { wrapper, quickMessagesStore } = createWrapper();

    wrapper.vm.quickMessageToEdit = {
      title: 'T',
      text: 'Hello',
      shortcut: 'x',
    };

    await wrapper.vm.createQuickMessage({
      title: 'T',
      text: 'Hello',
      shortcut: 'x',
    });

    expect(quickMessagesStore.create).toHaveBeenCalledWith({
      title: 'T',
      text: 'Hello',
      shortcut: 'x',
    });
    expect(wrapper.vm.quickMessageToEdit).toBe(null);
  });

  it('updateQuickMessage calls store update and clears quickMessageToEdit', async () => {
    const { wrapper, quickMessagesStore } = createWrapper();

    wrapper.vm.quickMessageToEdit = quickMessageFixture;

    await wrapper.vm.updateQuickMessage(quickMessageFixture);

    expect(quickMessagesStore.update).toHaveBeenCalledWith({
      uuid: 'qm-1',
      title: 'Title',
      text: 'Body',
      shortcut: 'hi',
    });
    expect(wrapper.vm.quickMessageToEdit).toBe(null);
  });

  it('deleteQuickMessage calls store delete and clears quickMessageToDelete', async () => {
    const { wrapper, quickMessagesStore } = createWrapper();

    wrapper.vm.quickMessageToDelete = quickMessageFixture;

    await wrapper.vm.deleteQuickMessage();

    expect(quickMessagesStore.delete).toHaveBeenCalledWith('qm-1');
    expect(wrapper.vm.quickMessageToDelete).toBe(null);
  });

  it('renders root aside stub', () => {
    const { wrapper } = createWrapper();

    expect(
      wrapper.find('[data-testid="quick-messages-aside-root"]').exists(),
    ).toBe(true);
  });
});
