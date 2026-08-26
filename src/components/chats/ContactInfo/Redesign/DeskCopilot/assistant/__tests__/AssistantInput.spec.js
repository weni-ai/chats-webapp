import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AssistantInput from '../AssistantInput.vue';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

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

  it('emits startRecording when the mic button is clicked', async () => {
    wrapper = createWrapper();
    await wrapper.find('[data-testid="assistant-input-mic"]').trigger('click');
    expect(wrapper.emitted('startRecording')).toBeTruthy();
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

  it('shows the recording bar while recording', () => {
    wrapper = createWrapper({ isRecording: true, recordingDurationMs: 1000 });
    expect(
      wrapper.find('[data-testid="assistant-audio-recording-bar"]').exists(),
    ).toBe(true);
  });
});
