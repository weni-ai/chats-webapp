import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Additional imports for Vue Test Utils
import { mount } from '@vue/test-utils';
import ModalQuickMessages from '../ModalQuickMessages.vue';

describe('useRooms Store Actions and Getters', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());

    wrapper = mount(ModalQuickMessages, {
      global: {
        mocks: {
          $router: { push: vi.fn() },
        },
      },
    });
  });

  it('renders ModalQuickMessages component correctly', () => {
    expect(
      wrapper.find('[data-testid="modal-quick-messages-container"]').exists(),
    ).toBe(true);
    expect(
      wrapper.findComponent('[data-testid="quick-message-list"]').exists(),
    ).toBe(true);
  });

  it('emits close event when modal is closed', async () => {
    await wrapper
      .findComponent('[data-testid="modal-quick-messages"]')
      .vm.$emit('close');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits select-quick-message event with correct payload', async () => {
    const message = { id: 1, text: 'Hello' };
    await wrapper
      .findComponent('[data-testid="quick-message-list"]')
      .vm.$emit('select-quick-message', message);
    expect(wrapper.emitted('select-quick-message')[0]).toEqual([message]);
  });

  it('calls openHomeNewQuickMessage and navigates to home with query', async () => {
    const mockRouter = { push: vi.fn() };

    const wrapper = mount(ModalQuickMessages, {
      global: {
        mocks: { $t: (msg) => msg, $router: mockRouter },
      },
    });

    await wrapper.setData({ isQuickMessagesEmpty: true });

    await wrapper
      .find('[data-testid="quick-message-new-button"]')
      .trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'home',
      query: { newQuickMessage: true },
    });
  });
});
