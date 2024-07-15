export const PREFERENCES_SOUND = 'WENICHATS_PREFERENCES_SOUND';

export default class SoundNotification {
  /**
   * @type {HTMLAudioElement}
   */
  #soundNotification;

  constructor(soundName, type = 'wav') {
    this.#soundNotification = new Audio(`/notifications/${soundName}.${type}`);
  }

  notify() {
    const soundPreference = localStorage.getItem(PREFERENCES_SOUND);
    if (soundPreference === 'no') {
      return;
    }

    // If the user hadn't interacted with the page yet (click, scroll...),
    // the browser blocks the audio playing because is considered autoplay media
    this.#soundNotification.play().catch(() => {});
  }
}
