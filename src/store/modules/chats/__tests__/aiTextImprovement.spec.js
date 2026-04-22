import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAiTextImprovement } from '../aiTextImprovement';

vi.mock('@/services/api/resources/chats/aiTextImprovement', () => ({
  default: { improve: vi.fn() },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({ default: vi.fn() }));

vi.mock('@/plugins/i18n', () => ({
  default: { global: { t: (key) => key } },
}));

let mockImprove;
let mockCallAlert;

describe('aiTextImprovement store', () => {
  let store;

  beforeEach(async () => {
    setActivePinia(createPinia());

    const apiModule = await import(
      '@/services/api/resources/chats/aiTextImprovement'
    );
    mockImprove = apiModule.default.improve;

    const alertModule = await import('@/utils/callUnnnicAlert');
    mockCallAlert = alertModule.default;

    store = useAiTextImprovement();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(store.isLoading).toBe(false);
      expect(store.isPopoverOpen).toBe(false);
      expect(store.selectedType).toBeNull();
      expect(store.improvedText).toBe('');
      expect(store.originalText).toBe('');
      expect(store.feedbackStatus).toBeNull();
      expect(store.hasImprovedText).toBe(false);
    });

    it('should set showNewTag to true when localStorage has no value', () => {
      expect(store.showNewTag).toBe(true);
    });

    it('should set showNewTag to false when localStorage has the flag', () => {
      localStorage.setItem('ai_text_improvement_new_tag_seen', 'true');
      setActivePinia(createPinia());
      const freshStore = useAiTextImprovement();
      expect(freshStore.showNewTag).toBe(false);
    });
  });

  describe('hideNewTag', () => {
    it('should set showNewTag to false and persist to localStorage', () => {
      store.hideNewTag();
      expect(store.showNewTag).toBe(false);
      expect(localStorage.getItem('ai_text_improvement_new_tag_seen')).toBe(
        'true',
      );
    });
  });

  describe('getAiTextImprovementPayload', () => {
    it('should return null when selectedType is not set', () => {
      store.feedbackStatus = 'USED';
      expect(store.getAiTextImprovementPayload('text')).toBeNull();
    });

    it('should return null when feedbackStatus is not set', () => {
      store.selectedType = 'CLARITY';
      expect(store.getAiTextImprovementPayload('text')).toBeNull();
    });

    it('should return USED when text matches improvedText', () => {
      store.selectedType = 'CLARITY';
      store.feedbackStatus = 'USED';
      store.improvedText = 'improved';

      const payload = store.getAiTextImprovementPayload('improved');
      expect(payload).toEqual({ status: 'USED', type: 'CLARITY' });
    });

    it('should return EDITED when text differs from improvedText', () => {
      store.selectedType = 'GRAMMAR_AND_SPELLING';
      store.feedbackStatus = 'USED';
      store.improvedText = 'improved';

      const payload = store.getAiTextImprovementPayload('edited text');
      expect(payload).toEqual({
        status: 'EDITED',
        type: 'GRAMMAR_AND_SPELLING',
      });
    });

    it('should return feedbackStatus directly for non-USED statuses', () => {
      store.selectedType = 'MORE_EMPATHY';
      store.feedbackStatus = 'DISCARDED';
      store.improvedText = 'improved';

      const payload = store.getAiTextImprovementPayload('original');
      expect(payload).toEqual({ status: 'DISCARDED', type: 'MORE_EMPATHY' });
    });
  });

  describe('requestImprovement', () => {
    it('should call API and return improved text on success', async () => {
      mockImprove.mockResolvedValue({ text: 'better text' });

      const result = await store.requestImprovement('hello', 'CLARITY');

      expect(mockImprove).toHaveBeenCalledWith(
        { text: 'hello', type: 'CLARITY' },
        { signal: expect.any(AbortSignal) },
      );
      expect(result).toBe('better text');
      expect(store.improvedText).toBe('better text');
      expect(store.originalText).toBe('hello');
      expect(store.selectedType).toBe('CLARITY');
      expect(store.feedbackStatus).toBe('USED');
      expect(store.isLoading).toBe(false);
    });

    it('should close popover and set loading during request', async () => {
      let resolvePromise;
      mockImprove.mockImplementation(
        () => new Promise((resolve) => (resolvePromise = resolve)),
      );

      const promise = store.requestImprovement('hello', 'CLARITY');
      expect(store.isPopoverOpen).toBe(false);
      expect(store.isLoading).toBe(true);

      resolvePromise({ text: 'done' });
      await promise;
      expect(store.isLoading).toBe(false);
    });

    it('should show alert on API error and return null', async () => {
      mockImprove.mockRejectedValue(new Error('Network error'));

      const result = await store.requestImprovement('hello', 'CLARITY');

      expect(result).toBeNull();
      expect(mockCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'ai_text_improvement.error',
          type: 'error',
        },
      });
      expect(store.isLoading).toBe(false);
    });

    it('should return null without alert on abort', async () => {
      mockImprove.mockRejectedValue(
        new DOMException('Aborted', 'AbortError'),
      );

      const result = await store.requestImprovement('hello', 'CLARITY');

      expect(result).toBeNull();
      expect(mockCallAlert).not.toHaveBeenCalled();
    });
  });

  describe('cancelImprovement', () => {
    it('should abort the controller and reset loading state', async () => {
      let resolvePromise;
      mockImprove.mockImplementation(
        () => new Promise((resolve) => (resolvePromise = resolve)),
      );

      const promise = store.requestImprovement('hello', 'CLARITY');
      expect(store.isLoading).toBe(true);

      store.cancelImprovement();
      expect(store.isLoading).toBe(false);
      expect(store.feedbackStatus).toBeNull();

      resolvePromise({ text: 'done' });
      await promise.catch(() => {});
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      store.isLoading = true;
      store.isPopoverOpen = true;
      store.selectedType = 'CLARITY';
      store.improvedText = 'improved';
      store.originalText = 'original';
      store.feedbackStatus = 'USED';

      store.reset();

      expect(store.isLoading).toBe(false);
      expect(store.isPopoverOpen).toBe(false);
      expect(store.selectedType).toBeNull();
      expect(store.improvedText).toBe('');
      expect(store.originalText).toBe('');
      expect(store.feedbackStatus).toBeNull();
    });
  });

  describe('hasImprovedText', () => {
    it('should return true when improvedText has a value', () => {
      store.improvedText = 'some text';
      expect(store.hasImprovedText).toBe(true);
    });

    it('should return false when improvedText is empty', () => {
      store.improvedText = '';
      expect(store.hasImprovedText).toBe(false);
    });
  });
});
