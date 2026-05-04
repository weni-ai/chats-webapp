import { afterEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import Rooms from '../rooms';

vi.mock('@/services/api/http');

describe('Rooms', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should request rooms count by sector', async () => {
    const sector = '21aecf8c-0c73-4059-ba82-4343e0cc627c';
    const expectedData = { waiting: 12, in_service: 7 };

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Rooms.count({ sector });

    expect(http.get).toHaveBeenCalledWith('/rooms_count/', {
      params: { sector },
    });
    expect(result).toEqual(expectedData);
  });

  it('should request rooms count by queue', async () => {
    const queue = 'f2519480-7e58-4fc4-9894-000000000000';
    const expectedData = { waiting: 3, in_service: 1 };

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Rooms.count({ queue });

    expect(http.get).toHaveBeenCalledWith('/rooms_count/', {
      params: { queue },
    });
    expect(result).toEqual(expectedData);
  });

  it('should send empty params when no argument is provided', async () => {
    http.get.mockResolvedValue({ data: { waiting: 0, in_service: 0 } });

    await Rooms.count();

    expect(http.get).toHaveBeenCalledWith('/rooms_count/', { params: {} });
  });
});
