import { vi, describe, it, expect, beforeEach } from 'vitest';
import http from '@/services/api/http';
import QuickMessageApi from '../quickMessage';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'https://api.example.com/v1',
    },
  },
}));
vi.mock('@/utils/config');

describe('QuickMessageApi', () => {
  const messageData = {
    title: 'Sector Message',
    text: 'Message content',
    shortcut: 'shortcut',
  };
  beforeEach(() => {
    vi.clearAllMocks();
    getProject.mockResolvedValue('project-uuid');
  });

  it('should fetch all quick messages', async () => {
    const mockResponse = { data: [{ id: 1, title: 'Message 1' }] };
    http.get.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.getAll({});

    expect(http.get).toHaveBeenCalledWith('/quick_messages/');
    expect(response).toEqual(mockResponse.data);
  });

  it('should fetch all quick messages by sector', async () => {
    const mockResponse = { data: [{ id: 1, title: 'Sector Message' }] };
    http.get.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.getAllBySector({});

    expect(http.get).toHaveBeenCalledWith(
      '/sector_quick_messages/?project=project-uuid',
    );
    expect(response).toEqual(mockResponse.data);
  });

  it('should fetch all v2 quick messages', async () => {
    const mockResponse = { data: { results: [], next: '' } };
    http.get.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.getAllV2({});

    expect(http.get).toHaveBeenCalledWith('/quick_messages/', {
      baseURL: 'https://api.example.com/v2',
    });
    expect(response).toEqual(mockResponse.data);
  });

  it('should fetch v2 shared quick messages by sector', async () => {
    const mockResponse = { data: { results: [], next: '' } };
    http.get.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.getBySectorV2({
      sectorUuid: 'sector1',
    });

    expect(getProject).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(
      '/sector_quick_messages/?sector=sector1',
      { baseURL: 'https://api.example.com/v2' },
    );
    expect(response).toEqual(mockResponse.data);
  });

  it('should paginate v2 shared quick messages by sector using next', async () => {
    const mockResponse = { data: { results: [], next: '' } };
    http.get.mockResolvedValueOnce(mockResponse);

    await QuickMessageApi.getBySectorV2({
      sectorUuid: 'sector1',
      next: 'https://api.test/v2/sector_quick_messages/?cursor=abc',
    });

    expect(getProject).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith(
      '/sector_quick_messages/?cursor=abc',
      { baseURL: 'https://api.example.com/v2' },
    );
  });

  it('should fetch v2 shared quick messages by project', async () => {
    const mockResponse = { data: { results: [], next: '' } };
    http.get.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.getByProjectV2({});

    expect(http.get).toHaveBeenCalledWith(
      '/sector_quick_messages/?project=project-uuid',
      { baseURL: 'https://api.example.com/v2' },
    );
    expect(response).toEqual(mockResponse.data);
  });

  it('should paginate v2 shared quick messages by project using next', async () => {
    const mockResponse = { data: { results: [], next: '' } };
    http.get.mockResolvedValueOnce(mockResponse);

    await QuickMessageApi.getByProjectV2({
      next: 'https://api.test/v2/sector_quick_messages/?cursor=abc',
    });

    expect(http.get).toHaveBeenCalledWith(
      '/sector_quick_messages/?cursor=abc',
      {
        baseURL: 'https://api.example.com/v2',
      },
    );
  });

  it('should create a quick message', async () => {
    const mockResponse = { data: { id: 1, title: 'New Message' } };

    http.post.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.create(messageData);

    expect(http.post).toHaveBeenCalledWith('/quick_messages/', messageData);
    expect(response).toEqual(mockResponse.data);
  });

  it('should create a quick message by sector', async () => {
    const mockResponse = { data: { id: 1, title: 'Sector Message' } };

    http.post.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.createBySector({
      ...messageData,
      sectorUuid: 'sector1',
    });

    expect(http.post).toHaveBeenCalledWith('/sector_quick_messages/', {
      sector: 'sector1',
      title: messageData.title,
      text: messageData.text,
      shortcut: messageData.shortcut,
    });

    expect(response).toEqual(mockResponse.data);
  });

  it('should update a quick message', async () => {
    const mockResponse = { data: { id: 1, title: 'Updated Message' } };

    http.patch.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.update(1, messageData);

    expect(http.patch).toHaveBeenCalledWith('/quick_messages/1/', messageData);
    expect(response).toEqual(mockResponse.data);
  });

  it('should update a quick message by sector', async () => {
    const mockResponse = { data: { id: 1, title: 'Updated Sector Message' } };

    http.patch.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.updateBySector(1, messageData);

    expect(http.patch).toHaveBeenCalledWith(
      '/sector_quick_messages/1/',
      messageData,
    );
    expect(response).toEqual(mockResponse.data);
  });

  it('should delete a quick message', async () => {
    const mockResponse = { data: { id: 1, title: 'Message Deleted' } };
    http.delete.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.delete(1);

    expect(http.delete).toHaveBeenCalledWith('/quick_messages/1/');
    expect(response).toEqual(mockResponse.data);
  });

  it('should delete a quick message by sector', async () => {
    const mockResponse = { data: { id: 1, title: 'Sector Message Deleted' } };
    http.delete.mockResolvedValueOnce(mockResponse);

    const response = await QuickMessageApi.deleteBySector(1);

    expect(http.delete).toHaveBeenCalledWith('/sector_quick_messages/1/');
    expect(response).toEqual(mockResponse.data);
  });
});
