import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import BulkMessage from '../index.vue';
import BulkMessageService from '@/services/api/resources/chats/bulkMessage';
import { useBulkMessageSend } from '@/store/modules/chats/bulkMessageSend';

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    watchDebounced: vi.fn((source, cb) => {
      return actual.watchDebounced(source, cb, {
        debounce: 0,
        maxWait: 0,
      });
    }),
  };
});

vi.mock('@/services/api/resources/chats/bulkMessage', () => ({
  default: {
    countRooms: vi.fn(),
    sendMessage: vi.fn(),
    getLastSentMessages: vi.fn(),
    checkIfHasShippingHistory: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    UnnnicCallAlert: vi.fn(),
    UnnnicToastManager: {
      ...mod.UnnnicToastManager,
      success: vi.fn(),
      error: vi.fn(),
      attention: vi.fn(),
    },
  };
});

describe('BulkMessage', () => {
  let wrapper;
  let store;
  let pinia;

  const createWrapper = () => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useBulkMessageSend();

    return mount(BulkMessage, {
      global: {
        plugins: [pinia],
        stubs: {
          ContactsStatus: {
            name: 'ContactsStatus',
            props: ['status'],
            emits: ['update:status'],
            template: '<div data-testid="contacts-status" />',
          },
          SelectFilters: {
            name: 'SelectFilters',
            props: ['queues', 'representatives'],
            emits: ['update:queues', 'update:representatives'],
            template: '<div data-testid="select-filters" />',
          },
          LastMessages: {
            name: 'LastMessages',
            props: ['messages'],
            template: '<div data-testid="last-messages" />',
          },
          ModalProgressBar: {
            name: 'ModalProgressBar',
            props: ['modelValue', 'title'],
            template: '<div data-testid="modal-progress-bar-wrapper" />',
          },
          ShippingHistoryModal: {
            name: 'ShippingHistoryModal',
            emits: ['close'],
            template: '<div data-testid="shipping-history-modal" />',
          },
          UnnnicTextArea: {
            name: 'UnnnicTextAreaStub',
            props: [
              'modelValue',
              'label',
              'placeholder',
              'message',
              'maxLength',
            ],
            emits: ['update:modelValue'],
            template:
              '<textarea data-testid="message-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
          UnnnicCheckbox: {
            name: 'UnnnicCheckboxStub',
            props: ['modelValue', 'label'],
            emits: ['update:modelValue'],
            template:
              '<input data-testid="agree-checkbox" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
          },
          UnnnicCheckboxGroup: {
            template: '<div><slot /></div>',
          },
          UnnnicDisclaimer: {
            name: 'UnnnicDisclaimerStub',
            props: ['description'],
            template:
              '<div data-testid="contacts-disclaimer">{{ description }}</div>',
          },
          UnnnicButton: {
            name: 'UnnnicButtonStub',
            props: ['text', 'type', 'size', 'disabled', 'loading', 'iconLeft'],
            emits: ['click'],
            inheritAttrs: false,
            template:
              '<button type="button" v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
          },
          UnnnicLabel: true,
          UnnnicToolTip: {
            template: '<div><slot /></div>',
          },
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    BulkMessageService.countRooms.mockResolvedValue({ count: 5 });
    BulkMessageService.getLastSentMessages.mockResolvedValue([]);
    BulkMessageService.checkIfHasShippingHistory.mockResolvedValue(false);
    BulkMessageService.sendMessage.mockResolvedValue({
      status: 'PROCESSING',
      uuid: 'send-uuid',
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should load contacts count, last messages and shipping history on mount', async () => {
    BulkMessageService.getLastSentMessages.mockResolvedValue([
      { uuid: 'msg-1', text: 'Hi', sent_at: '2026-07-28T10:00:00Z' },
    ]);
    BulkMessageService.checkIfHasShippingHistory.mockResolvedValue(true);

    wrapper = createWrapper();
    await flushPromises();

    expect(BulkMessageService.countRooms).toHaveBeenCalled();
    expect(BulkMessageService.getLastSentMessages).toHaveBeenCalled();
    expect(BulkMessageService.checkIfHasShippingHistory).toHaveBeenCalled();
    expect(wrapper.vm.contactsCount).toBe(5);
    expect(wrapper.vm.hasShippingHistory).toBe(true);
    expect(wrapper.find('[data-testid="last-messages"]').exists()).toBe(true);
  });

  it('should enable send only when form is valid and user agrees', async () => {
    wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.validForm).toBe(false);

    wrapper.vm.message = 'Hello contacts';
    wrapper.vm.agreeToSend = true;
    await flushPromises();

    expect(wrapper.vm.validForm).toBe(true);
    expect(wrapper.vm.agreeToSend).toBe(true);
  });

  it('should keep form invalid when queues are empty', async () => {
    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.message = 'Hello contacts';
    wrapper.vm.selectedQueues = [];
    await flushPromises();

    expect(wrapper.vm.hasRequiredFilters).toBe(false);
    expect(wrapper.vm.validForm).toBe(false);
  });

  it('should keep form invalid when representatives are empty', async () => {
    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.message = 'Hello contacts';
    wrapper.vm.selectedRepresentatives = [];
    await flushPromises();

    expect(wrapper.vm.hasRequiredFilters).toBe(false);
    expect(wrapper.vm.validForm).toBe(false);
  });

  it('should reset agreement when form becomes invalid', async () => {
    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.message = 'Hello';
    wrapper.vm.agreeToSend = true;
    await flushPromises();

    wrapper.vm.message = '   ';
    await flushPromises();

    expect(wrapper.vm.validForm).toBe(false);
    expect(wrapper.vm.agreeToSend).toBe(false);
  });

  it('should emit close when cancel is clicked', async () => {
    wrapper = createWrapper();
    await flushPromises();

    await wrapper
      .find('[data-testid="bulk-message-cancel-button"]')
      .trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should send message and set sending uuid when status is PROCESSING', async () => {
    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.message = 'Bulk hello';
    wrapper.vm.agreeToSend = true;
    await wrapper.vm.handleSend();
    await flushPromises();

    expect(BulkMessageService.sendMessage).toHaveBeenCalledWith({
      text: 'Bulk hello',
      status: ['ongoing', 'waiting'],
      queues: ['all'],
      agents: ['all'],
    });
    expect(store.isSending).toBe(true);
    expect(store.sendingUuid).toBe('send-uuid');
  });

  it('should stop loading state when send fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    BulkMessageService.sendMessage.mockRejectedValue(new Error('fail'));

    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.message = 'Bulk hello';
    await wrapper.vm.handleSend();
    await flushPromises();

    expect(store.isSending).toBe(false);
    expect(store.sendingUuid).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should open shipping history modal when history button is clicked', async () => {
    BulkMessageService.checkIfHasShippingHistory.mockResolvedValue(true);

    wrapper = createWrapper();
    await flushPromises();

    wrapper.vm.handleShippingHistory();
    await flushPromises();

    expect(store.showShippingModal).toBe(true);
    expect(
      wrapper.find('[data-testid="shipping-history-modal"]').exists(),
    ).toBe(true);
  });

  it('should show progress modal while sending', async () => {
    wrapper = createWrapper();
    await flushPromises();

    store.isSending = true;
    store.percentageSent = 30;
    await flushPromises();

    expect(
      wrapper.find('[data-testid="modal-progress-bar-wrapper"]').exists(),
    ).toBe(true);
  });

  it('should show contacts disclaimer when count is greater than zero', async () => {
    wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.find('[data-testid="contacts-disclaimer"]').exists()).toBe(
      true,
    );
  });
});
