import { describe, it, expect, vi, beforeEach } from 'vitest';
import mime from 'mime';
import {
  getSupportedChatMediaFormats,
  sendMediaMessage,
  validateMediaFormat,
  treatedMediaName,
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

describe('treatedMediaName', () => {
  it('should extract filename from URL with query parameters', () => {
    const url = 'https://example.com/document.pdf?param1=value1&param2=value2';
    const result = treatedMediaName(url);

    expect(result).toBe('document.pdf');
  });

  it('should extract filename from S3 URL with AWS parameters', () => {
    const url =
      'https://weni-staging-chats.s3.amazonaws.com/Rspack__Module_Federation_-_Weni_by_vtex_1.pdf?AWSAccessKeyId=ASIAQCLGXYHIXGJQ2ZHC&Signature=MQKNODNfnafvAF%2FOll%2B4tGN9OP0%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEKT';
    const result = treatedMediaName(url);

    expect(result).toBe('Rspack__Module_Federation_-_Weni_by_vtex_1.pdf');
  });

  it('should extract filename from URL without query parameters', () => {
    const url = 'https://example.com/files/report.docx';
    const result = treatedMediaName(url);

    expect(result).toBe('report.docx');
  });

  it('should decode URI encoded filenames', () => {
    const url = 'https://example.com/My%20Document%20File.pdf?key=value';
    const result = treatedMediaName(url);

    expect(result).toBe('My Document File.pdf');
  });

  it('should handle filenames with special characters', () => {
    const url = 'https://example.com/file_name-test(1).pdf?version=2';
    const result = treatedMediaName(url);

    expect(result).toBe('file_name-test(1).pdf');
  });

  it('should handle filenames with multiple dots', () => {
    const url = 'https://example.com/my.backup.file.tar.gz?download=true';
    const result = treatedMediaName(url);

    expect(result).toBe('my.backup.file.tar.gz');
  });

  it('should throw error when mediaName is null', () => {
    expect(() => treatedMediaName(null)).toThrow(
      'Pass as a parameter the name of the media you want to handle',
    );
  });

  it('should throw error when mediaName is undefined', () => {
    expect(() => treatedMediaName(undefined)).toThrow(
      'Pass as a parameter the name of the media you want to handle',
    );
  });

  it('should throw error when mediaName is empty string', () => {
    expect(() => treatedMediaName('')).toThrow(
      'Pass as a parameter the name of the media you want to handle',
    );
  });

  it('should handle URLs with fragment identifiers', () => {
    const url = 'https://example.com/document.pdf?key=value#section1';
    const result = treatedMediaName(url);

    expect(result).toBe('document.pdf');
  });

  it('should handle simple filenames without domain', () => {
    const url = '/path/to/file.txt?query=param';
    const result = treatedMediaName(url);

    expect(result).toBe('file.txt');
  });

  it('should fallback to original string without params on decoding error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const originalDecode = global.decodeURIComponent;
    global.decodeURIComponent = vi.fn(() => {
      throw new Error('Decode error');
    });

    const url = 'https://example.com/file.pdf?key=value';
    const result = treatedMediaName(url);

    expect(result).toBe('https://example.com/file.pdf');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing media name:',
      expect.any(Error),
    );

    global.decodeURIComponent = originalDecode;
    consoleSpy.mockRestore();
  });
});
