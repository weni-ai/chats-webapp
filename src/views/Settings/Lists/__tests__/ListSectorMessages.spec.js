import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import QuickMessageList from '../ListSectorMessages.vue';

import { useConfig } from '@/store/modules/config';
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

vi.spyOn(Sector, 'update')
  .mockResolvedValue({
    status: 200,
    can_use_chat_completion: true,
    can_input_context: true,
    completion_context: true,
  })
  .mockResolvedValueOnce({ status: 400, can_use_chat_completion: undefined });

vi.spyOn(QuickMessage, 'delete').mockResolvedValue({});

const createdMessageMock = {
  sector: '1',
  title: 'Message Title',
  text: 'Message Text',
  shortcut: 'SRT',
};

const updatedMessageMock = {
  uuid: '1',
  sector: '1',
  text: 'Message Updated',
  shortcut: 'upd',
};

vi.spyOn(QuickMessage, 'createBySector').mockResolvedValue(createdMessageMock);
vi.spyOn(QuickMessage, 'updateBySector').mockResolvedValue(updatedMessageMock);

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
      mocks: {
        $t: (msg) => msg,
      },
    },
  });
};

describe('ListSectorMessages', () => {
  let wrapper;
  let configStore;
  let quickMessageStore;
  beforeEach(() => {
    wrapper = createWrapper();
    configStore = useConfig();
    quickMessageStore = useQuickMessageShared();
  });

  it('should render the copilot switch and set the correct text', async () => {
    const copilotSwitch = wrapper.findComponent('[data-testid=copilot-switch]');

    expect(copilotSwitch.exists()).toBe(true);
    expect(copilotSwitch.props('modelValue')).toBe(false);

    await copilotSwitch.setValue(true);
    expect(copilotSwitch.props('modelValue')).toBe(true);
  });

  it('should call handleCopilotActive when copilot switch is toggled', async () => {
    const handleCopilotActive = vi.spyOn(wrapper.vm, 'handleCopilotActive');
    const saveSector = vi.spyOn(wrapper.vm, 'saveSector');
    const copilotSwitch = wrapper.findComponent('[data-testid=copilot-switch]');

    await copilotSwitch.setValue(true);
    expect(handleCopilotActive).toHaveBeenCalledWith(true);
    expect(saveSector).toHaveBeenCalled();
  });

  it('should display the custom rules switch when copilot is active', async () => {
    configStore.copilot.active = true;
    await wrapper.vm.$nextTick();

    const customRulesSwitch = wrapper.findComponent(
      '[data-testid="copilot-custom-rules-switch"]',
    );
    expect(customRulesSwitch.exists()).toBe(true);

    await customRulesSwitch.setValue(true);
    expect(customRulesSwitch.props('modelValue')).toBe(true);
  });

  it('should call handleCustomRulesActive when custom rules switch is toggled', async () => {
    configStore.copilot.active = true;
    await wrapper.vm.$nextTick();

    const handleCustomRulesActive = vi.spyOn(
      wrapper.vm,
      'handleCustomRulesActive',
    );

    const customRulesSwitch = wrapper.findComponent(
      '[data-testid="copilot-custom-rules-switch"]',
    );

    await customRulesSwitch.setValue(true);
    expect(handleCustomRulesActive).toHaveBeenCalledWith(true);
  });

  it('should display the textarea when both switches are active', async () => {
    const handleCustomRules = vi.spyOn(wrapper.vm, 'handleCustomRules');
    configStore.copilot.active = true;
    configStore.copilot.customRulesActive = true;
    await wrapper.vm.$nextTick();

    const textarea = wrapper.findComponent(
      '[data-testid="copilot-custom-rules-textarea"]',
    );

    expect(textarea.exists()).toBe(true);

    await textarea.setValue('Custom Rule');

    expect(handleCustomRules).toHaveBeenCalledWith('Custom Rule');
  });

  it('should render the UnnnicCard and call openMessageCreate on click', async () => {
    const openConfigMessageDrawer = vi.spyOn(
      wrapper.vm,
      'openConfigMessageDrawer',
    );

    const createQuickMessagCard = wrapper.findComponent(
      '[data-testid="create-quick-message-card"]',
    );

    expect(createQuickMessagCard.exists()).toBe(true);

    await createQuickMessagCard.trigger('click');

    expect(openConfigMessageDrawer).toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 1));

    const createQuickMessageDrawer = wrapper.findComponent(
      '[data-testid="quick-message-config-drawer"]',
    );

    expect(createQuickMessageDrawer.exists()).toBe(true);

    const quickMessageForm = wrapper.findComponent(
      '[data-testid="quick-message-form"]',
    );
    expect(quickMessageForm.exists()).toBe(true);
    expect(quickMessageForm.props().modelValue).toEqual({
      title: '',
      text: '',
      shortcut: '',
    });
  });

  it('should create a new quick message shared', async () => {
    const handlerCreateQuickMessage = vi.spyOn(
      wrapper.vm,
      'handlerCreateQuickMessage',
    );
    const createQuickMessagCard = wrapper.findComponent(
      '[data-testid="create-quick-message-card"]',
    );
    await createQuickMessagCard.trigger('click');

    await new Promise((resolve) => setTimeout(resolve, 1));

    const createQuickMessageDrawer = wrapper.findComponent(
      '[data-testid="quick-message-config-drawer"]',
    );

    const shortcutInput = wrapper.findComponent(
      '[data-testid="quick-message-shortcut-input"]',
    );
    const textInput = wrapper.findComponent(
      '[data-testid="quick-message-text-input"]',
    );

    shortcutInput.setValue(createdMessageMock.shortcut);
    textInput.setValue(createdMessageMock.text);

    await wrapper.vm.$nextTick();

    await createQuickMessageDrawer.vm.$emit('primary-button-click');
    expect(handlerCreateQuickMessage).toHaveBeenCalled();

    await flushPromises();

    expect(wrapper.vm.quickMessagesShared.length).toEqual(1);
    expect(wrapper.vm.quickMessagesShared[0]).toEqual(createdMessageMock);
  });

  it('should render UnnnicSimpleCard for each quick message and call openMessageToEdit on click', async () => {
    quickMessageStore.quickMessagesShared = [
      { uuid: '1', title: 'Message 1', text: 'Text 1', sector: '1' },
      { uuid: '2', title: 'Message 2', text: 'Text 2', sector: '1' },
    ];

    await wrapper.vm.$nextTick();

    const quickMessageCards = wrapper.findAllComponents(
      '[data-testid="quick-message-card"]',
    );
    expect(quickMessageCards.length).toBe(2);

    const openConfigMessageDrawer = vi.spyOn(
      wrapper.vm,
      'openConfigMessageDrawer',
    );

    await quickMessageCards[0].trigger('click');

    await wrapper.vm.$nextTick();

    expect(openConfigMessageDrawer).toHaveBeenCalledWith(
      quickMessageStore.quickMessagesShared[0],
    );

    await new Promise((resolve) => setTimeout(resolve, 1));

    const editQuickMessageDrawer = wrapper.findComponent(
      '[data-testid="quick-message-config-drawer"]',
    );

    expect(editQuickMessageDrawer.exists()).toBe(true);

    const quickMessageForm = wrapper.findComponent(
      '[data-testid="quick-message-form"]',
    );
    expect(quickMessageForm.exists()).toBe(true);
    expect(quickMessageForm.props().modelValue).toEqual(
      quickMessageStore.quickMessagesShared[0],
    );
  });

  it('should call deleteMessage on click delete message button', async () => {
    const deleteMessage = vi.spyOn(wrapper.vm, 'deleteMessage');

    quickMessageStore.quickMessagesShared = [
      { uuid: '1', title: 'Message 1', text: 'Text 1', sector: '1' },
      { uuid: '2', title: 'Message 2', text: 'Text 2', sector: '1' },
    ];

    const deletedMessage = quickMessageStore.quickMessagesShared[0];

    await wrapper.vm.$nextTick();

    const quickMessageCards = wrapper.findAllComponents(
      '[data-testid="quick-message-card"]',
    );

    expect(quickMessageCards.length).toBe(2);

    const dropdownMenuButton = quickMessageCards[0].findComponent(
      '[data-testid="open-dropdown-menu-button"]',
    );

    await dropdownMenuButton.trigger('click');

    const excludeButton = quickMessageCards[0].findComponent(
      '[data-testid="dropdown-delete"]',
    );

    await excludeButton.trigger('click');

    expect(deleteMessage).toBeCalledWith(deletedMessage);
  });

  it('shold call save sector on unmounted component', async () => {
    const saveSector = vi.spyOn(wrapper.vm, 'saveSector');
    wrapper.unmount();
    expect(saveSector).toHaveBeenCalled();
  });
});
