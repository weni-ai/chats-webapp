import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import ModalQueuePriorizations from '@/components/ModalQueuePriorizations.vue';
import Queues from '@/services/api/resources/chats/queues';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/queues', () => ({
  default: {
    editListQueues: vi.fn(),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const meQueues = [
  {
    uuid: 'perm-1',
    queue_name: 'Support',
    role: 1,
    queue: 'queue-1',
  },
  {
    uuid: 'perm-2',
    queue_name: 'Billing',
    role: 2,
    queue: 'queue-2',
  },
];

const createWrapper = (options = {}) => {
  const {
    modelValue = true,
    queues = meQueues,
    rooms = [
      { uuid: 'room-1', queue: { uuid: 'queue-2' } },
      { uuid: 'room-2', queue: { uuid: 'queue-1' } },
    ],
  } = options;

  const wsReconnect = vi.fn();

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: true,
    initialState: {
      profile: {
        me: { queues: [...queues] },
      },
      rooms: {
        rooms: [...rooms],
      },
    },
  });
  setActivePinia(pinia);

  const Parent = {
    name: 'TestWrapper',
    components: { ModalQueuePriorizations },
    data: () => ({ open: modelValue }),
    methods: {
      wsReconnect,
    },
    template: '<ModalQueuePriorizations v-model="open" ref="modal" />',
  };

  const parent = mount(Parent, {
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicDisclaimer: true,
        UnnnicMultiSelect: {
          name: 'UnnnicMultiSelect',
          template: '<div data-testid="queue-priorizations-select" />',
          props: [
            'modelValue',
            'options',
            'label',
            'placeholder',
            'message',
            'returnObject',
            'clearable',
            'enableSearch',
            'search',
          ],
        },
        UnnnicButton: {
          name: 'UnnnicButton',
          inheritAttrs: false,
          template:
            '<button :data-text="text" :disabled="disabled" @click="$emit(\'click\')" />',
          props: ['text', 'type', 'size', 'disabled'],
        },
      },
    },
  });

  return {
    parent,
    wrapper: parent.findComponent(ModalQueuePriorizations),
    wsReconnect,
  };
};

describe('ModalQueuePriorizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the modal and queue select', () => {
    const { wrapper, parent } = createWrapper();
    expect(wrapper.exists()).toBe(true);
    expect(parent.find('.queue-modal').exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="queue-priorizations-select"]').exists(),
    ).toBe(true);
  });

  it('should populate queues and selectedQueues from me.queues on mount', () => {
    const { wrapper } = createWrapper();

    expect(wrapper.vm.queues).toHaveLength(2);
    expect(wrapper.vm.selectedQueues).toHaveLength(1);
    expect(wrapper.vm.selectedQueues[0].value).toBe('perm-1');
  });

  it('should disable save when no queues are selected', async () => {
    const { wrapper } = createWrapper();
    wrapper.vm.selectedQueues = [];
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.verifySelectedLength).toBe(false);
    const saveButton = wrapper
      .findAll('button')
      .find((btn) => btn.attributes('data-text') === 'save');
    expect(saveButton.attributes('disabled')).toBeDefined();
  });

  it('should enable save when at least one queue is selected', () => {
    const { wrapper } = createWrapper();
    expect(wrapper.vm.verifySelectedLength).toBe(true);
  });

  it('should emit update:modelValue when cancel is clicked', async () => {
    const { wrapper } = createWrapper();
    const cancelButton = wrapper
      .findAll('button')
      .find((btn) => btn.attributes('data-text') === 'cancel');

    await cancelButton.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });

  it('should save selected queues and show success alert', async () => {
    Queues.editListQueues.mockResolvedValue({});
    const { wrapper, parent, wsReconnect } = createWrapper();

    // VTU $root may not expose Parent methods; attach explicitly
    wrapper.vm.$root.wsReconnect = parent.vm.wsReconnect || wsReconnect;

    await wrapper.vm.saveListQueues();
    await flushPromises();

    expect(Queues.editListQueues).toHaveBeenCalledWith(
      expect.arrayContaining([
        { uuid: 'perm-1', role: 1 },
        { uuid: 'perm-2', role: 2 },
      ]),
    );
    expect(callUnnnicAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          text: 'chats.success_update_queues',
          type: 'success',
        }),
      }),
    );
    expect(wsReconnect).toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
  });

  it('should show error alert when save fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Queues.editListQueues.mockRejectedValue(new Error('network'));
    const { wrapper } = createWrapper();

    await wrapper.vm.saveListQueues();
    await flushPromises();

    expect(callUnnnicAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          text: 'chats.error_update_queues',
          type: 'error',
        }),
      }),
    );
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    consoleSpy.mockRestore();
  });
});
