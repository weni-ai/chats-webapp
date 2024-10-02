import { expect, describe, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import MessagesForm from '../ListSectorMessages.vue';

import { useConfig } from '@/store/modules/config';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

import Sector from '@/services/api/resources/settings/sector';
import QuickMessage from '@/services/api/resources/chats/quickMessage';

vi.spyOn(Sector, 'update')
  .mockResolvedValue({
    status: 200,
    can_use_chat_completion: true,
    can_input_context: true,
    completion_context: true,
  })
  .mockResolvedValueOnce({ status: 400, can_use_chat_completion: undefined });

vi.spyOn(QuickMessage, 'delete').mockResolvedValue({});

const createWrapper = (props = {}) => {
  return mount(MessagesForm, {
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
    const openMessageCreate = vi.spyOn(wrapper.vm, 'openMessageCreate');

    const createQuickMessagCard = wrapper.findComponent(
      '[data-testid="create-quick-message-card"]',
    );
    expect(createQuickMessagCard.exists()).toBe(true);

    await createQuickMessagCard.trigger('click');

    expect(openMessageCreate).toHaveBeenCalled();
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

    const openMessageToEdit = vi.spyOn(wrapper.vm, 'openMessageToEdit');
    await quickMessageCards[0].trigger('click');

    expect(openMessageToEdit).toHaveBeenCalledWith(
      quickMessageStore.quickMessagesShared[0],
    );
  });
  it('should call deleteMessage on click delete message button', async () => {
    const deleteMessage = vi.spyOn(wrapper.vm, 'deleteMessage');

    quickMessageStore.quickMessagesShared = [
      { uuid: '1', title: 'Message 1', text: 'Text 1', sector: '1' },
      { uuid: '2', title: 'Message 2', text: 'Text 2', sector: '1' },
    ];

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

    expect(deleteMessage).toBeCalledWith(
      quickMessageStore.quickMessagesShared[0],
    );
  });

  it('shold call save sector on unmounted component', async () => {
    const saveSector = vi.spyOn(wrapper.vm, 'saveSector');
    wrapper.unmount();
    expect(saveSector).toHaveBeenCalled();
  });
});
