import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SoundNotification, {
  PREFERENCES_SOUND,
} from '@/services/api/websocket/soundNotification';

const playMock = vi.fn().mockImplementation(() => Promise.resolve());
const MockAudio = vi.fn().mockImplementation(() => ({
  play: playMock,
}));

vi.stubGlobal('Audio', MockAudio);

describe('SoundNotification', () => {
  let soundNotification;

  beforeEach(() => {
    localStorage.clear();
    soundNotification = new SoundNotification('test-sound');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('notify', () => {
    it('should play sound if preference is not "no"', async () => {
      localStorage.setItem(PREFERENCES_SOUND, 'yes');

      await soundNotification.notify();

      expect(playMock).toHaveBeenCalled();
    });

    it('should not play sound if preference is "no"', async () => {
      localStorage.setItem(PREFERENCES_SOUND, 'no');

      await soundNotification.notify();

      expect(playMock).not.toHaveBeenCalled();
    });
  });
});
