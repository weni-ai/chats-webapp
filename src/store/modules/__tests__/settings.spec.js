import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useSettings } from '@/store/modules/settings';
import Sector from '@/services/api/resources/settings/sector';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: { list: vi.fn(), find: vi.fn(), deleteSector: vi.fn() },
}));

vi.mock('@/utils/array', () => ({
  removeDuplicatedItems: vi.fn((items) => items),
}));

describe('useSettings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const settings = useSettings();

    expect(settings.sectors).toEqual([]);
    expect(settings.isLoadingSectors).toBe(false);
    expect(settings.nextSectors).toBe('');
    expect(settings.previousSectors).toBe('');
    expect(settings.currentSector).toBe(null);
  });

  it('should fetch sectors and update state', async () => {
    const sectorsMock = [{ id: 1, name: 'Sector 1' }];
    Sector.list.mockResolvedValue({
      results: sectorsMock,
      next: 'nextPage',
      previous: '',
    });

    const settings = useSettings();
    await settings.getSectors();

    expect(Sector.list).toHaveBeenCalledWith({ nextReq: '' });
    expect(settings.sectors).toEqual(sectorsMock);
    expect(settings.nextSectors).toBe('nextPage');
    expect(settings.previousSectors).toBe('');
  });

  it('should add a sector', () => {
    const settings = useSettings();
    settings.sectors = [{ id: 1, name: 'Existing Sector', queues: [] }];

    const newSector = { name: 'New Sector', queues: [{ name: 'Queue 1' }] };
    settings.addSector(newSector);

    expect(settings.sectors.length).toBe(2);
    expect(settings.sectors[1].id).toBe(2);
    expect(settings.sectors[1].queues[0].id).toBe(100);
  });

  it('should fetch current sector and update state', async () => {
    const sectorMock = { id: 1, name: 'Sector 1' };
    Sector.find.mockResolvedValue(sectorMock);

    const settings = useSettings();
    await settings.getCurrentSector(1);

    expect(Sector.find).toHaveBeenCalledWith(1);
    expect(settings.currentSector).toEqual(sectorMock);
  });

  it('should update an existing sector', () => {
    const settings = useSettings();
    settings.sectors = [{ id: 1, name: 'Old Sector' }];

    const updatedSector = { id: 1, name: 'Updated Sector' };
    settings.updateSector(updatedSector);

    expect(settings.sectors[0].name).toBe('Updated Sector');
  });

  it('should delete a sector', async () => {
    const settings = useSettings();
    settings.sectors = [{ id: 1, uuid: 'uuid-1', name: 'Sector 1' }];

    Sector.deleteSector.mockResolvedValue();

    await settings.deleteSector('uuid-1');

    expect(Sector.deleteSector).toHaveBeenCalledWith('uuid-1');
    expect(settings.sectors.length).toBe(0);
  });

  it('should return sector by id', () => {
    const settings = useSettings();
    settings.sectors = [{ id: 1, name: 'Sector 1' }];

    const sector = settings.getSectorById(1);

    expect(sector).toEqual({ id: 1, name: 'Sector 1' });
  });

  it('should save a new sector with default contacts count', () => {
    const settings = useSettings();
    settings.sectors = [
      { id: 1, name: 'Existing Sector', contacts: { count: 10 } },
    ];

    const newSector = { name: 'New Sector', queues: [] };
    settings.saveSector(newSector);

    expect(settings.sectors.length).toBe(2);
    expect(settings.sectors[1]).toEqual(
      expect.objectContaining({
        name: 'New Sector',
        contacts: { count: 0 },
      }),
    );
  });
});
