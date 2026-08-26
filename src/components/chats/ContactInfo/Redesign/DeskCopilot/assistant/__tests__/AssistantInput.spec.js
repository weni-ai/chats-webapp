import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import AssistantInput from '../AssistantInput.vue';
import i18n from '@/plugins/i18n';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem.js';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (
    UnnnicSystemPlugin &&
    config.global.plugins &&
    !config.global.plugins.includes(UnnnicSystemPlugin)
  ) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

const createWrapper = (props = {}) =>
  mount(AssistantInput, {
    props: {
      isAudioRecordingSupported: true,
      canEnterVoiceMode: false,
      fileConfig: {
        allowedTypes: ['image/png'],
        maxFileSize: 1024,
        acceptAttribute: 'image/png',
      },
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicButton: {
          name: 'UnnnicButton',
          template: '<button v-bind="$attrs" @click="$emit(\'click\')" />',
        },
        UnnnicIcon: true,
        UnnnicPopover: {
          name: 'UnnnicPopover',
          template:
            '<div data-testid="assistant-input-media-popover"><slot /></div>',
        },
        UnnnicPopoverTrigger: {
          name: 'UnnnicPopoverTrigger',
          template: '<div><slot /></div>',
        },
        UnnnicPopoverContent: {
          name: 'UnnnicPopoverContent',
          template:
            '<div data-testid="assistant-input-media-menu"><slot /></div>',
        },
        UnnnicPopoverOption: {
          name: 'UnnnicPopoverOption',
          inheritAttrs: false,
          props: ['label', 'icon'],
          template:
            '<button v-bind="$attrs" @click="$emit(\'click\')">{{ label }}</button>',
        },
        AudioRecordingBar: {
          name: 'AssistantAudioRecordingBar',
          template: '<div data-testid="assistant-audio-recording-bar" />',
        },
        VoiceModeButton: {
          name: 'AssistantVoiceModeButton',
          template:
            '<button data-testid="assistant-voice-mode-button" @click="$emit(\'click\')" />',
        },
        VoiceModePanel: true,
        VoiceModeError: true,
      },
    },
  });

describe('AssistantInput', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('emits send with trimmed text', async () => {
    wrapper = createWrapper();
    await wrapper
      .find('[data-testid="assistant-input-textarea"]')
      .setValue(' Hello ');
    await wrapper
      .find('[data-testid="assistant-input-textarea"]')
      .trigger('keydown.enter');

    expect(wrapper.emitted('send')?.[0]).toEqual(['Hello']);
  });

  it('emits startRecording from the media menu audio option', async () => {
    wrapper = createWrapper();
    await wrapper
      .find('[data-testid="assistant-input-audio-option"]')
      .trigger('click');
    expect(wrapper.emitted('startRecording')).toBeTruthy();
  });

  it('opens the file picker from the upload option', async () => {
    wrapper = createWrapper();
    const clickSpy = vi.fn();
    const fileInput = wrapper.find('[data-testid="assistant-input-file"]');
    fileInput.element.click = clickSpy;

    await wrapper
      .find('[data-testid="assistant-input-upload-option"]')
      .trigger('click');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('emits attach when a valid file is selected', async () => {
    wrapper = createWrapper();
    const input = wrapper.find('[data-testid="assistant-input-file"]');
    const file = new File(['x'], 'note.png', { type: 'image/png' });

    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    });
    await input.trigger('change');

    expect(wrapper.emitted('attach')?.[0]).toEqual([file]);
  });

  it('shows the recording layout while recording', () => {
    wrapper = createWrapper({ isRecording: true, recordingDurationMs: 1000 });
    expect(
      wrapper.find('[data-testid="assistant-input-recording"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="assistant-audio-recording-bar"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="assistant-audio-recording-send"]').exists(),
    ).toBe(true);
  });

  it('shows the voice mode button when voice is available and draft is empty', () => {
    wrapper = createWrapper({ canEnterVoiceMode: true });
    expect(
      wrapper.find('[data-testid="assistant-voice-mode-button"]').exists(),
    ).toBe(true);
  });
});
