import { config, mount } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import i18n from '@/plugins/i18n';
import MessageManagerTextBoxAudioRecorder from '../AudioRecorder.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

describe('MessageManagerTextBoxAudioRecorder.vue', () => {
  let pinia;
  let recordMock;

  beforeEach(() => {
    pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
    recordMock = vi.fn();
    useMessageManager().audioMessage = document.createElement('audio');
  });

  const createWrapper = () => {
    const UnnnicAudioRecorderStub = {
      name: 'UnnnicAudioRecorder',
      inheritAttrs: false,
      props: {
        modelValue: { default: null },
        saveText: String,
        hideRecordingIndicator: Boolean,
      },
      emits: ['update:modelValue', 'status'],
      template:
        '<div data-testid="text-box-audio-recorder" class="text-box__audio-recorder" v-bind="$attrs" />',
      methods: {
        record() {
          recordMock();
        },
      },
    };

    return mount(MessageManagerTextBoxAudioRecorder, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        components: {
          UnnnicAudioRecorder: UnnnicAudioRecorderStub,
        },
      },
    });
  };

  it('keeps the recorder hidden while status is idle', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'idle';

    const wrapper = createWrapper();
    const el = wrapper.find('[data-testid="text-box-audio-recorder"]');

    expect(el.exists()).toBe(true);
    expect(el.isVisible()).toBe(false);
  });

  it('shows the recorder when status is recording', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'recording';

    const wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="text-box-audio-recorder"]').isVisible(),
    ).toBe(true);
  });

  it('updates audioRecorderStatus when the child emits status', async () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'idle';

    const wrapper = createWrapper();
    const stub = wrapper.findComponent({ name: 'UnnnicAudioRecorder' });
    await stub.vm.$emit('status', 'recording');

    expect(messageManagerStore.audioRecorderStatus).toBe('recording');
  });

  it('exposes record() and forwards to UnnnicAudioRecorder', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.audioRecorderStatus = 'recording';

    const wrapper = createWrapper();
    wrapper.vm.record();

    expect(recordMock).toHaveBeenCalledTimes(1);
  });
});
