import { mount } from '@vue/test-utils';
import { expect, describe, it, vi, beforeEach } from 'vitest';

import SendFlowButton from '../SendFlowButton.vue';
import { createTestingPinia } from '@pinia/testing';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: { sendFlow: vi.fn() },
}));

describe('SendFlowButton', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(SendFlowButton, {
      global: { plugins: [createTestingPinia()] },
      props: { selectedFlow: '' },
    });
  });

  it('renders with the correct initial state', () => {
    const button = wrapper.find('[data-testid="send-flow-button"]');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('disables button when selectedFlow is empty', async () => {
    const button = wrapper.find('[data-testid="send-flow-button"]');
    expect(button.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ selectedFlow: 'flow-uuid' });
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('emits events when sendFlow is called', async () => {
    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1' }],
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');

    expect(wrapper.emitted('send-flow-started')).toHaveLength(1);

    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
  });

  it('calls FlowsTrigger.sendFlow with correct parameters', async () => {
    const contacts = [
      { external_id: 'contact-1', name: 'Contact 1' },
      { uuid: 'contact-2', name: 'Contact 2' },
    ];

    await wrapper.setProps({ selectedFlow: 'flow-uuid', contacts });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');

    expect(FlowsTrigger.sendFlow).toHaveBeenCalledWith({
      flow: 'flow-uuid',
      contacts: ['contact-1'],
      room: undefined,
      contact_name: 'Contact 1',
    });

    expect(FlowsTrigger.sendFlow).toHaveBeenCalledWith({
      flow: 'flow-uuid',
      contacts: ['contact-2'],
      room: undefined,
      contact_name: 'Contact 2',
    });
  });

  it('handles errors gracefully during flow sending', async () => {
    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1' }],
      selectedContact: { external_id: 'contact-1' },
    });
    const consoleError = vi.spyOn(console, 'error');

    FlowsTrigger.sendFlow.mockRejectedValueOnce(new Error('API error'));

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');

    expect(FlowsTrigger.sendFlow).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(new Error('API error'));

    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
  });
});
