import { describe, it, expect, vi, beforeEach } from 'vitest';
import mime from 'mime';
import {
  getSupportedChatMediaFormats,
  sendMediaMessage,
  validateMediaFormat,
} from '@/utils/medias.js';

vi.mock('mime', () => ({
  default: {
    getType: vi.fn(),
  },
}));

const mockSendRoomMedias = vi.fn();
const mockSendDiscussionMedias = vi.fn();

vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: () => ({
    sendRoomMedias: mockSendRoomMedias,
  }),
}));

vi.mock('@/store/modules/chats/discussionMessages', () => ({
  useDiscussionMessages: () => ({
    sendDiscussionMedias: mockSendDiscussionMedias,
  }),
}));

describe('getSupportedChatMediaFormats', () => {
  const defaultFormats = [
    '.png',
    '.jpeg',
    '.jpg',
    '.mp4',
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.xls',
    '.xlsx',
    '.csv',
  ];
  it('should return all supported formats by default', () => {
    const formats = getSupportedChatMediaFormats();
    expect(formats).toEqual(defaultFormats);
  });

  it('should return an default array for unsupported types', () => {
    const formats = getSupportedChatMediaFormats('unsuported');
    expect(formats).toEqual(defaultFormats);
  });

  it('should return only image formats when type is "image"', () => {
    const formats = getSupportedChatMediaFormats('image');
    expect(formats).toEqual(['.png', '.jpeg', '.jpg', '.mp4']);
  });

  it('should return only document formats when type is "doc"', () => {
    const formats = getSupportedChatMediaFormats('doc');
    expect(formats).toEqual([
      '.pdf',
      '.doc',
      '.docx',
      '.txt',
      '.xls',
      '.xlsx',
      '.csv',
    ]);
  });
});

describe('sendMediaMessage', () => {
  const mockFiles = [{ name: 'file1.png' }, { name: 'file2.pdf' }];
  let mockProgressCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressCallback = vi.fn();
  });

  it('should update loadingFiles and call progressCallback with correct progress', async () => {
    mockSendRoomMedias.mockImplementationOnce(({ updateLoadingFiles }) => {
      updateLoadingFiles('uuid1', 50);
      updateLoadingFiles('uuid2', 100);
    });

    await sendMediaMessage({
      files: mockFiles,
      routeName: 'room',
      progressCallback: mockProgressCallback,
    });

    expect(mockProgressCallback).toHaveBeenCalledTimes(3);
    expect(mockProgressCallback).toHaveBeenNthCalledWith(1, 50);
    expect(mockProgressCallback).toHaveBeenNthCalledWith(2, 75);
    expect(mockProgressCallback).toHaveBeenLastCalledWith(undefined);
  });

  it('should send media to discussions when routeName is "discussion"', async () => {
    await sendMediaMessage({
      files: mockFiles,
      routeName: 'discussion',
      progressCallback: mockProgressCallback,
    });

    expect(mockSendDiscussionMedias).toHaveBeenCalledWith({
      files: mockFiles,
      updateLoadingFiles: expect.any(Function),
    });
    expect(mockProgressCallback).toHaveBeenCalledWith(undefined);
  });

  it('should send media to rooms when routeName is not "discussion"', async () => {
    await sendMediaMessage({
      files: mockFiles,
      routeName: 'room',
      progressCallback: mockProgressCallback,
    });

    expect(mockSendRoomMedias).toHaveBeenCalledWith({
      files: mockFiles,
      updateLoadingFiles: expect.any(Function),
    });
    expect(mockProgressCallback).toHaveBeenCalledWith(undefined);
  });

  it('should handle errors and call progressCallback with undefined', async () => {
    mockSendRoomMedias.mockRejectedValue(new Error('Test error'));

    await sendMediaMessage({
      files: mockFiles,
      routeName: 'room',
      progressCallback: mockProgressCallback,
    });

    expect(mockSendRoomMedias).toHaveBeenCalled();
    expect(mockProgressCallback).toHaveBeenCalledWith(undefined);
  });
});

describe('validateMediaFormat', () => {
  it('should return true for valid file format and type', () => {
    const files = [{ name: 'test.png', type: 'image/png' }];
    vi.mocked(mime.getType).mockReturnValue('image/png');

    const result = validateMediaFormat(files);

    expect(result).toEqual(files[0]);
    expect(mime.getType).toHaveBeenCalledWith('test.png');
  });

  it('should return false for invalid file format', () => {
    const files = [{ name: 'test.exe', type: 'application/x-msdownload' }];
    vi.mocked(mime.getType).mockReturnValue('application/x-msdownload');

    const result = validateMediaFormat(files);

    expect(result).toBeUndefined();
    expect(mime.getType).toHaveBeenCalledWith('test.exe');
  });

  it('should return false for empty file list', () => {
    const result = validateMediaFormat([]);
    expect(result).toBeUndefined();
  });
});
