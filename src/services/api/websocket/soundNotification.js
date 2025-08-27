export const PREFERENCES_SOUND = 'preferencesSound';

import pingBing from './sounds/ping-bing.wav';
import achievementConfirmation from './sounds/achievement-confirmation.wav';
import selectSound from './sounds/select-sound.wav';

import { moduleStorage } from '@/utils/storage';

export default class SoundNotification {
  /**
   * @type {HTMLAudioElement}
   */
  #soundNotification;

  constructor(soundName) {
    const nameMapper = {
      'ping-bing': pingBing,
      'achievement-confirmation': achievementConfirmation,
      'select-sound': selectSound,
    };
    this.#soundNotification = new Audio(nameMapper[soundName]);
  }

  notify() {
    const soundPreference = moduleStorage.getItem(PREFERENCES_SOUND);
    if (soundPreference === 'no') {
      return;
    }

    // If the user hadn't interacted with the page yet (click, scroll...),
    // the browser blocks the audio playing because is considered autoplay media
    this.#soundNotification.play().catch(() => {});
  }
}
