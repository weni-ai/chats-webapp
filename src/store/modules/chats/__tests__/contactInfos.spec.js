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
    expect(store.mediasCursor).toBeNull();
    expect(store.documentsCursor).toBeNull();
    expect(store.audiosCursor).toBeNull();
    expect(store.hasMoreMedias).toBe(true);
    expect(store.hasMoreDocuments).toBe(true);
    expect(store.hasMoreAudios).toBe(true);
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
    Media.listFromContactAndRoom.mockResolvedValueOnce({
      results: [
        { content_type: 'image/png', url: 'image.png' },
        { content_type: 'application/pdf', url: 'doc.pdf' },
      ],
      next: 'https://api.example.com/media/?cursor=next-cursor-1',
      previous: null,
      nextCursor: 'next-cursor-1',
      previousCursor: null,
    });

    await store.loadMedias({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.isLoadingMedias).toBe(false);
    expect(store.medias).toHaveLength(1);
    expect(store.mediasCursor).toBe('next-cursor-1');
    expect(store.hasMoreMedias).toBe(true);
    expect(Media.listFromContactAndRoom).toHaveBeenCalledTimes(1);
  });

  it('should load next page of medias when loadNextMedias is called', async () => {
    // First page
    Media.listFromContactAndRoom.mockResolvedValueOnce({
      results: [{ content_type: 'image/png', url: 'image1.png' }],
      next: 'https://api.example.com/media/?cursor=cursor-1',
      previous: null,
      nextCursor: 'cursor-1',
      previousCursor: null,
    });

    await store.loadMedias({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.medias).toHaveLength(1);
    expect(store.hasMoreMedias).toBe(true);

    // Second page
    Media.listFromContactAndRoom.mockResolvedValueOnce({
      results: [{ content_type: 'video/mp4', url: 'video.mp4' }],
      next: null,
      previous: 'https://api.example.com/media/?cursor=cursor-1',
      nextCursor: null,
      previousCursor: 'cursor-1',
    });

    await store.loadNextMedias({
      contact: 'contact-123',
      room: 'room-123',
    });

    expect(store.medias).toHaveLength(2);
    expect(store.mediasCursor).toBeNull();
    expect(store.hasMoreMedias).toBe(false);
  });

  it('should not load more medias when hasMoreMedias is false', async () => {
    // Simulate a state where there are no more medias to load
    Media.listFromContactAndRoom.mockResolvedValueOnce({
      results: [{ content_type: 'image/png', url: 'image.png' }],
      next: null,
      previous: null,
      nextCursor: null,
      previousCursor: null,
    });

    await store.loadMedias({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    // Now hasMoreMedias should be false
    expect(store.hasMoreMedias).toBe(false);
    vi.clearAllMocks();

    // Try to load more - should not make another API call
    await store.loadNextMedias({
      contact: 'contact-123',
      room: 'room-123',
    });

    expect(Media.listFromContactAndRoom).not.toHaveBeenCalled();
  });

  it('should load medias for closed room with pagination', async () => {
    Media.listFromContactAndClosedRoom.mockResolvedValueOnce({
      results: [{ content_type: 'image/png', url: 'image.png' }],
      next: 'https://api.example.com/media/?cursor=next-cursor-2',
      previous: null,
      nextCursor: 'next-cursor-2',
      previousCursor: null,
    });

    await store.loadMedias({ contactInfo: 'contact-info-123', history: true });

    expect(store.medias).toHaveLength(1);
    expect(store.mediasCursor).toBe('next-cursor-2');
    expect(store.hasMoreMedias).toBe(true);
  });

  it('should load next page for closed room when loadNextMediasClosedRoom is called', async () => {
    // First page
    Media.listFromContactAndClosedRoom.mockResolvedValueOnce({
      results: [{ content_type: 'image/png', url: 'image.png' }],
      next: 'https://api.example.com/media/?cursor=cursor-2',
      previous: null,
      nextCursor: 'cursor-2',
      previousCursor: null,
    });

    await store.loadMedias({ contactInfo: 'contact-info-123', history: true });

    expect(store.medias).toHaveLength(1);

    // Second page
    Media.listFromContactAndClosedRoom.mockResolvedValueOnce({
      results: [{ content_type: 'video/mp4', url: 'video.mp4' }],
      next: null,
      previous: 'https://api.example.com/media/?cursor=cursor-2',
      nextCursor: null,
      previousCursor: 'cursor-2',
    });

    await store.loadNextMediasClosedRoom({
      contactInfo: 'contact-info-123',
    });

    expect(store.medias).toHaveLength(2);
    expect(store.mediasCursor).toBeNull();
    expect(store.hasMoreMedias).toBe(false);
  });

  it('should load documents with pagination and history mode', async () => {
    Media.listFromContactAndRoom
      .mockResolvedValueOnce({
        results: [
          { content_type: 'application/pdf', url: 'doc.pdf' },
          { content_type: 'image/png', url: 'image.png' },
        ],
        next: 'https://api.example.com/media/?cursor=next-cursor-3',
        previous: null,
        nextCursor: 'next-cursor-3',
        previousCursor: null,
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'application/zip', url: 'file.zip' }],
        next: null,
        previous: 'https://api.example.com/media/?cursor=prev-cursor-3',
        nextCursor: null,
        previousCursor: 'prev-cursor-3',
      });

    await store.loadDocuments({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.isLoadingDocuments).toBe(false);
    expect(store.documents).toHaveLength(2);
    expect(store.documentsCursor).toBeNull();

    Media.listFromContactAndClosedRoom
      .mockResolvedValueOnce({
        results: [{ content_type: 'application/pdf', url: 'doc2.pdf' }],
        next: 'https://api.example.com/media/?cursor=next-cursor-4',
        previous: null,
        nextCursor: 'next-cursor-4',
        previousCursor: null,
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'application/msword', url: 'doc3.doc' }],
        next: null,
        previous: 'https://api.example.com/media/?cursor=prev-cursor-4',
        nextCursor: null,
        previousCursor: 'prev-cursor-4',
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
      previous: null,
      nextCursor: null,
      previousCursor: null,
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
        next: 'https://api.example.com/media/?cursor=next-cursor-5',
        previous: null,
        nextCursor: 'next-cursor-5',
        previousCursor: null,
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/wav', url: 'audio2.wav' }],
        next: null,
        previous: 'https://api.example.com/media/?cursor=prev-cursor-5',
        nextCursor: null,
        previousCursor: 'prev-cursor-5',
      });

    await store.loadAudios({
      contact: 'contact-123',
      room: 'room-123',
      history: false,
    });

    expect(store.audios).toHaveLength(2);
    expect(store.audiosCursor).toBeNull();

    store.audios = [];
    store.audiosCursor = null;

    Media.listFromContactAndClosedRoom
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/ogg', url: 'audio3.ogg' }],
        next: 'https://api.example.com/media/?cursor=next-cursor-6',
        previous: null,
        nextCursor: 'next-cursor-6',
        previousCursor: null,
      })
      .mockResolvedValueOnce({
        results: [{ content_type: 'audio/aac', url: 'audio4.aac' }],
        next: null,
        previous: 'https://api.example.com/media/?cursor=prev-cursor-6',
        nextCursor: null,
        previousCursor: 'prev-cursor-6',
      });

    await store.loadAudios({
      contactInfo: 'contact-info-123',
      history: true,
    });

    expect(store.audios).toHaveLength(2);
    expect(store.audiosCursor).toBeNull();
    expect(store.audios[0].duration).toBe(160);
    expect(store.audios[1].duration).toBe(150);
  });

  it('should set and clear contact info correctly', () => {
    store.setCurrentContact('contact-456', 'room-789');
    expect(store.currentContactUuid).toBe('contact-456');
    expect(store.currentRoomUuid).toBe('room-789');

    store.medias = [{ content_type: 'image/png', url: 'image.png' }];
    store.mediasCursor = 'some-cursor';
    store.hasMoreMediasFlag = false;

    store.clearAll();

    expect(store.medias).toEqual([]);
    expect(store.mediasCursor).toBeNull();
    expect(store.hasMoreMedias).toBe(true);
    expect(store.hasMoreDocuments).toBe(true);
    expect(store.hasMoreAudios).toBe(true);
    expect(store.currentContactUuid).toBeNull();
    expect(store.currentRoomUuid).toBeNull();
  });
});
