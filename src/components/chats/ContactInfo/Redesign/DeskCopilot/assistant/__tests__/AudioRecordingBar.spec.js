import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AudioRecordingBar from '../AudioRecordingBar.vue';

const createWrapper = (props = {}) =>
  mount(AudioRecordingBar, {
    props: {
      durationMs: 65000,
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
      },
    },
  });

describe('AssistantAudioRecordingBar', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('formats the recording duration and emits cancel', async () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="assistant-audio-recording-timer"]').text(),
    ).toBe('1:05');

    await wrapper
      .find('[data-testid="assistant-audio-recording-cancel"]')
      .trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
