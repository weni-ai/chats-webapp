import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useContactInfos } from '../contactInfos';
import Media from '@/services/api/resources/chats/media';

vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    listFromContactAndRoom: vi.fn(),
    listFromContactAndClosedRoom: vi.fn(),
  },
}));

describe('contactInfos Store', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useContactInfos();
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    expect(store.medias).toEqual([]);
    expect(store.documents).toEqual([]);
    expect(store.audios).toEqual([]);
    expect(store.isLoadingMedias).toBe(false);
    expect(store.isLoadingDocuments).toBe(false);
    expect(store.isLoadingAudios).toBe(false);
    expect(store.mediasPage).toBe(1);
    expect(store.documentsPage).toBe(1);
    expect(store.audiosPage).toBe(1);
    expect(store.currentContactUuid).toBeNull();
    expect(store.currentRoomUuid).toBeNull();
  });

  it('should filter images and videos correctly', () => {
    store.medias = [
      { content_type: 'image/png', url: 'image.png' },
      { content_type: 'video/mp4', url: 'video.mp4' },
      { content_type: 'application/pdf', url: 'doc.pdf' },
    ];

    expect(store.images).toHaveLength(2);
    expect(store.hasMedias).toBe(true);
  });

  it('should filter documents correctly', () => {
    store.documents = [
      { content_type: 'application/pdf', url: 'doc.pdf' },
      { content_type: 'image/png', url: 'image.png' },
      { content_type: 'audio/mp3', url: 'audio.mp3' },
    ];

    expect(store.docs).toHaveLength(1);
    expect(store.hasDocuments).toBe(true);
  });

  it('should return correct hasAudios value', () => {
    expect(store.hasAudios).toBe(false);
    store.audios = [{ content_type: 'audio/mp3', url: 'audio.mp3' }];
    expect(store.hasAudios).toBe(true);
  });

  it('should load medias with pagination and filter correctly', async () => {
    Media.listFromContactAndRoom
      .mockResolvedValueOnce({
        results: [
          { content_type: 'image/png', url: 'image.png' },
          { content_type: 'application/pdf', url: 'doc.pdf' },
        ],
        next: 'page2',
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'video/mp4', url: 'video.mp4' }],
        next: null,
      });

    const loadPromise = store.loadMedias({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.isLoadingMedias).toBe(true);
    await loadPromise;

    expect(store.isLoadingMedias).toBe(false);
    expect(store.medias).toHaveLength(2);
    expect(store.mediasPage).toBe(3);
    expect(Media.listFromContactAndRoom).toHaveBeenCalledTimes(2);
  });

  it('should load medias for closed room with pagination', async () => {
    Media.listFromContactAndClosedRoom
      .mockResolvedValueOnce({
        results: [{ content_type: 'image/png', url: 'image.png' }],
        next: 'page2',
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'video/mp4', url: 'video.mp4' }],
        next: null,
      });

    await store.loadMedias({ contactInfo: 'contact-info-123', history: true });

    expect(store.medias).toHaveLength(2);
    expect(store.mediasPage).toBe(3);
  });

  it('should load documents with pagination and history mode', async () => {
    Media.listFromContactAndRoom
      .mockResolvedValueOnce({
        results: [
          { content_type: 'application/pdf', url: 'doc.pdf' },
          { content_type: 'image/png', url: 'image.png' },
        ],
        next: 'page2',
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'application/zip', url: 'file.zip' }],
        next: null,
      });

    await store.loadDocuments({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.isLoadingDocuments).toBe(false);
    expect(store.documents).toHaveLength(2);
    expect(store.documentsPage).toBe(3);

    Media.listFromContactAndClosedRoom
      .mockResolvedValueOnce({
        results: [{ content_type: 'application/pdf', url: 'doc2.pdf' }],
        next: 'page2',
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'application/msword', url: 'doc3.doc' }],
        next: null,
      });

    await store.loadDocuments({
      contactInfo: 'contact-info-123',
      history: true,
    });

    expect(store.documents).toHaveLength(4);
  });

  it('should load audios with metadata handling', async () => {
    global.Audio = vi.fn().mockImplementation((url) => ({
      url,
      duration: 120,
      onloadedmetadata: null,
    }));

    Media.listFromContactAndRoom.mockResolvedValueOnce({
      results: [
        { content_type: 'audio/mp3', url: 'audio1.mp3' },
        { content_type: 'image/png', url: 'image.png' },
      ],
      next: null,
    });

    const loadPromise = store.loadAudios({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const audioInstance = global.Audio.mock.results[0];
    if (audioInstance?.value.onloadedmetadata) {
      audioInstance.value.onloadedmetadata({ path: [{ duration: 120 }] });
    }

    await loadPromise;

    expect(store.isLoadingAudios).toBe(false);
    expect(store.audios).toHaveLength(1);
    expect(store.audios[0]).toHaveProperty('duration', 120);
  });

  it('should handle audio pagination with different event formats', async () => {
    let callCount = 0;

    global.Audio = vi.fn().mockImplementation((url) => {
      const audio = {
        url,
        duration: 150,
        onloadedmetadata: null,
      };
      const currentCall = callCount;
      callCount++;

      setTimeout(() => {
        if (audio.onloadedmetadata) {
          if (currentCall === 2) {
            audio.onloadedmetadata({ path: [{ duration: 160 }] });
          } else {
            audio.onloadedmetadata({});
          }
        }
      }, 0);
      return audio;
    });

    Media.listFromContactAndRoom
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/mp3', url: 'audio1.mp3' }],
        next: 'page2',
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/wav', url: 'audio2.wav' }],
        next: null,
      });

    await store.loadAudios({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.audios).toHaveLength(2);
    expect(store.audiosPage).toBe(3);

    store.audios = [];
    store.audiosPage = 1;

    Media.listFromContactAndClosedRoom
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/ogg', url: 'audio3.ogg' }],
        next: 'page2',
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/aac', url: 'audio4.aac' }],
        next: null,
      });

    await store.loadAudios({
      contactInfo: 'contact-info-123',
      history: true,
    });

    expect(store.audios).toHaveLength(2);
    expect(store.audiosPage).toBe(3);
    expect(store.audios[0].duration).toBe(160);
    expect(store.audios[1].duration).toBe(150);
  });

  it('should set and clear contact info correctly', () => {
    store.setCurrentContact('contact-456', 'room-789');
    expect(store.currentContactUuid).toBe('contact-456');
    expect(store.currentRoomUuid).toBe('room-789');

    store.medias = [{ content_type: 'image/png', url: 'image.png' }];
    store.mediasPage = 5;

    store.clearAll();

    expect(store.medias).toEqual([]);
    expect(store.mediasPage).toBe(1);
    expect(store.currentContactUuid).toBeNull();
    expect(store.currentRoomUuid).toBeNull();
  });
});
