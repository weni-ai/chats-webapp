import { mount } from '@vue/test-utils';
import { beforeEach, describe, vi } from 'vitest';

import Audio from '../Audio.vue';

describe('MediaAudioPreview', () => {
  let wrapper;
  let playMock;
  let pauseMock;

  beforeEach(() => {
    playMock = vi.fn();
    pauseMock = vi.fn();

    global.Audio = vi.fn(() => ({
      play: playMock,
      pause: pauseMock,
      onended: null,
      paused: true,
    }));

    wrapper = mount(Audio, {
      props: {
        currentAudio: 'audio-file.mp3',
      },
    });
  });

  it('renders play icon when isTimerPlaying is false', async () => {
    await wrapper.setData({ isTimerPlaying: false });
    const playIcon = wrapper.find('[data-testid="play-icon"]');
    expect(playIcon.exists()).toBe(true);
    const pauseIcon = wrapper.find('[data-testid="pause-icon"]');
    expect(pauseIcon.exists()).toBe(false);
  });

  it('renders pause icon when isTimerPlaying is true', async () => {
    await wrapper.setData({ isTimerPlaying: true });
    const pauseIcon = wrapper.find('[data-testid="pause-icon"]');
    expect(pauseIcon.exists()).toBe(true);
    const playIcon = wrapper.find('[data-testid="play-icon"]');
    expect(playIcon.exists()).toBe(false);
  });

  it('plays audio when play click play icon', async () => {
    const play = wrapper.find('[data-testid="play"]');
    await play.trigger('click');
    expect(global.Audio).toHaveBeenCalledWith('audio-file.mp3');
  });

  it('pauses audio when pause method is called', async () => {
    await wrapper.vm.play(); // Start playing first
    const pause = wrapper.find('[data-testid="pause"]');
    await pause.trigger('click');
    expect(pauseMock).toHaveBeenCalled();
    expect(wrapper.vm.isTimerPlaying).toBe(false);
  });

  it('resets isTimerPlaying to false when audio ends', async () => {
    await wrapper.vm.play();

    wrapper.vm.audio.onended();
    expect(wrapper.vm.isTimerPlaying).toBe(false);
  });
});
