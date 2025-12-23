import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import moment from 'moment';
import isMobile from 'is-mobile';

import RoomsTableFilters from '../RoomsTableFilters.vue';
import RoomsTableFiltersLoading from '@/views/loadings/ClosedChats/RoomsTableFiltersLoading.vue';

import Sector from '@/services/api/resources/settings/sector';

vi.mock('is-mobile', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
    tags: vi.fn(),
  },
}));

vi.mock('moment', () => {
  const createMomentMock = () => ({
    subtract: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    format: vi.fn((format) => {
      if (format === 'YYYY-MM-DD') return '2023-01-01';
      return '2023-01-01';
    }),
    clone: vi.fn().mockReturnThis(),
    isAfter: vi.fn().mockReturnValue(false),
    isValid: vi.fn().mockReturnValue(true),
    startOf: vi.fn().mockReturnThis(),
  });

  const momentFn = vi.fn((date) => {
    if (!date || date === undefined || date === null) {
      return createMomentMock();
    }
    return createMomentMock();
  });
  momentFn.isMoment = vi.fn(() => true);
  return {
    default: momentFn,
  };
});

describe('RoomsTableFilters.vue', () => {
  let pinia;
  let wrapper;

  const createWrapper = (props = {}, mountOptions = {}, routeQuery = null) => {
    const defaultRouteQuery = { contactUrn: '', startDate: '', endDate: '' };
    const currentRouteQuery = routeQuery
      ? { ...defaultRouteQuery, ...routeQuery }
      : defaultRouteQuery;

    return mount(RoomsTableFilters, {
      global: {
        mocks: {
          $t: (key) => key,
          $i18n: { locale: 'en' },
          $route: { query: currentRouteQuery },
        },
        stubs: {
          UnnnicLabel: true,
          UnnnicInput: true,
          UnnnicSelectSmart: true,
          UnnnicInputDatePicker: true,
          UnnnicButton: true,
        },
        components: {
          RoomsTableFiltersLoading,
        },
        plugins: [pinia],
      },
      props: {
        value: null,
        vertically: false,
        ...props,
      },
      ...mountOptions,
    });
  };

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    Sector.list.mockReset().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return { results: [] };
    });
    Sector.tags.mockReset().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return { results: [] };
    });
    isMobile.mockReset().mockReturnValue(false);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering tests', () => {
    it('renders the component correctly when loading', async () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
      expect(
        wrapper.findComponent('[data-testid="filters-loading"]').exists(),
      ).toBe(true);
      expect(
        wrapper.findComponent('[data-testid="rooms-table-filters"]').exists(),
      ).toBe(false);
    });

    it('does not render sector filter when sectors length <= 2', async () => {
      Sector.list.mockResolvedValue({
        results: [{ uuid: 'sector1', name: 'Sector 1' }],
      });

      wrapper = createWrapper();
      await flushPromises();

      expect(
        wrapper.findComponent('[data-testid="sector-filter"]').exists(),
      ).toBe(false);
    });

    it('renders date picker for desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      expect(
        wrapper.findComponent('[data-testid="filter-date-picker"]').exists(),
      ).toBe(true);
      expect(
        wrapper
          .findComponent('[data-testid="filter-date-mobile-select"]')
          .exists(),
      ).toBe(false);
    });

    it('renders date select for mobile', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();

      expect(
        wrapper.findComponent('[data-testid="filter-date-picker"]').exists(),
      ).toBe(false);
      expect(
        wrapper
          .findComponent('[data-testid="filter-date-mobile-select"]')
          .exists(),
      ).toBe(true);
    });

    it('applies vertically class when vertically prop is true', async () => {
      wrapper = createWrapper({ vertically: true });
      await flushPromises();

      expect(wrapper.find('.rooms-table-filters--vertically').exists()).toBe(
        true,
      );
    });
  });

  describe('Data loading tests', () => {
    it('loads sectors correctly', async () => {
      Sector.list.mockResolvedValue({
        results: [
          { uuid: 'sector1', name: 'Sector 1' },
          { uuid: 'sector2', name: 'Sector 2' },
        ],
      });

      wrapper = createWrapper();
      await flushPromises();

      expect(Sector.list).toHaveBeenCalledWith({ limit: 50 });
      expect(wrapper.vm.sectorsToFilter.length).toBe(3);
      expect(wrapper.vm.sectorsToFilter[0]).toEqual({
        value: 'all',
        label: 'All',
      });
      expect(wrapper.vm.sectorsToFilter[1]).toEqual({
        value: 'sector1',
        label: 'Sector 1',
      });
    });

    it('sets isFiltersLoading to false after loading sectors', async () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isFiltersLoading).toBe(true);

      await flushPromises();

      expect(wrapper.vm.isFiltersLoading).toBe(false);
    });

    it('loads tags for selected sector', async () => {
      Sector.tags.mockResolvedValue({
        results: [
          { uuid: 'tag1', name: 'Tag 1' },
          { uuid: 'tag2', name: 'Tag 2' },
        ],
      });

      wrapper = createWrapper();
      await flushPromises();

      await wrapper.vm.getSectorTags('sector1');
      await flushPromises();

      expect(Sector.tags).toHaveBeenCalledWith('sector1', {
        next: '',
        limit: 20,
      });
      console.log(wrapper.vm.tagsToFilter);
      expect(wrapper.vm.tagsToFilter.length).toBe(3);
      expect(wrapper.vm.tagsToFilter[1]).toEqual({
        value: 'tag1',
        label: 'Tag 1',
      });
    });
  });

  describe('Filter interaction tests', () => {
    it('emits input event when contact filter changes', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const emitUpdateFiltersSpy = vi.spyOn(wrapper.vm, 'emitUpdateFilters');

      wrapper.vm.filterContact = 'Test Contact';

      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(800);
      vi.useRealTimers();

      expect(emitUpdateFiltersSpy).toHaveBeenCalled();
      const emittedInput = wrapper.emitted('input');
      expect(emittedInput).toBeTruthy();
      expect(emittedInput[emittedInput.length - 1][0].contact).toBe(
        'Test Contact',
      );
    });

    it('emits input event immediately on mobile when contact filter changes', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();

      const emitUpdateFiltersSpy = vi.spyOn(wrapper.vm, 'emitUpdateFilters');

      wrapper.vm.filterContact = 'Mobile Test';
      await wrapper.vm.$nextTick();

      expect(emitUpdateFiltersSpy).toHaveBeenCalled();
    });

    it('loads tags when sector filter changes to a specific sector', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const getSectorTagsSpy = vi.spyOn(wrapper.vm, 'getSectorTags');

      await wrapper.vm.$options.watch.filterSector.call(wrapper.vm, [
        { value: 'sector1', label: 'Sector 1' },
      ]);

      expect(getSectorTagsSpy).toHaveBeenCalledWith('sector1');
    });

    it('resets tags when sector filter changes to "all"', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filterTag = [{ value: 'tag1', label: 'Tag 1' }];

      await wrapper.vm.$options.watch.filterSector.call(wrapper.vm, [
        { value: 'all', label: 'All' },
      ]);

      expect(wrapper.vm.filterTag).toEqual([]);
      expect(wrapper.vm.tagsToFilter).toEqual([wrapper.vm.filterTagDefault]);
    });

    it('emits input event when tag filter changes', async () => {
      wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      wrapper.emitted('input');

      const newTagValue = [{ value: 'newTag', label: 'New Tag' }];
      wrapper.vm.filterTag = newTagValue;
      await flushPromises();
      await wrapper.vm.$nextTick();

      const emittedEvent = wrapper.emitted('input');
      expect(emittedEvent).toBeTruthy();
      expect(emittedEvent[emittedEvent.length - 1][0].tag).toEqual(newTagValue);
    });

    it('emits input event when date filter changes', async () => {
      wrapper = createWrapper();
      await flushPromises();
      await wrapper.vm.$nextTick();

      wrapper.emitted('input');

      const newDateValue = { start: '2023-02-01', end: '2023-02-02' };
      wrapper.vm.filterDate = newDateValue;
      await flushPromises();
      await wrapper.vm.$nextTick();

      const emittedEvent = wrapper.emitted('input');
      expect(emittedEvent).toBeTruthy();
      const lastEmittedPayload = emittedEvent[emittedEvent.length - 1][0];
      expect(lastEmittedPayload.date.start).toEqual(newDateValue.start);
      expect(lastEmittedPayload.date.end).toEqual(newDateValue.end);
    });

    it('resets filters to default values when resetFilters is called', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filterContact = 'Test Contact';
      wrapper.vm.filterSector = [{ value: 'sector1', label: 'Sector 1' }];
      wrapper.vm.filterTag = [{ value: 'tag1', label: 'Tag 1' }];
      wrapper.vm.filterDate = { start: '2023-02-01', end: '2023-02-07' };

      const isFiltersDefaultSpy = vi
        .spyOn(wrapper.vm, 'isFiltersDefault', 'get')
        .mockReturnValue(false);

      await wrapper
        .findComponent('[data-testid="filter-clear-button"]')
        .vm.$emit('click');

      expect(wrapper.vm.filterContact).toBe('');
      expect(wrapper.vm.filterTag).toEqual([]);
      expect(wrapper.vm.filterDate).toEqual(wrapper.vm.filterDateDefault);

      isFiltersDefaultSpy.mockRestore();
    });

    it('does not reset filters when isFiltersDefault is true', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filterContact = 'Test Contact';

      const isFiltersDefaultSpy = vi
        .spyOn(wrapper.vm, 'isFiltersDefault', 'get')
        .mockReturnValue(true);

      await wrapper.vm.resetFilters();

      expect(wrapper.vm.filterContact).toBe('Test Contact');

      isFiltersDefaultSpy.mockRestore();
    });
  });

  describe('Date handling tests', () => {
    it('handles date selection correctly in desktop mode', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      const datePayload = { start: '2023-01-01', end: '2023-01-07' };
      await wrapper.vm.handleDateSelect(datePayload);

      expect(wrapper.vm.selectedDatesInternal).toEqual(datePayload);
    });

    it('updates filter date correctly', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const datePayload = { start: '2023-01-01', end: '2023-01-07' };
      await wrapper.vm.updateFilterDate(datePayload);

      expect(wrapper.vm.filterDate).toEqual(datePayload);
    });

    it('correctly formats dates for mobile display', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.getRelativeDate = vi.fn().mockImplementation((value, type) => {
        if (value === 'last_7_days' && type === 'digit') return '2023-01-01';
        if (value === 'today' && type === 'digit') return '2023-01-01';
        return '';
      });

      wrapper.vm.filterDate = [{ value: 'last_7_days', label: 'Last 7 Days' }];

      await wrapper.vm.emitUpdateFilters();

      const emittedValue = wrapper.emitted('input')[0][0];
      expect(emittedValue.date.start).toBe('2023-01-01');
      expect(emittedValue.date.end).toBe('2023-01-01');
    });

    it('correctly formats dates for desktop display', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filterDate = { start: '2023-01-01', end: '2023-01-01' };

      await wrapper.vm.emitUpdateFilters();

      const emittedValue = wrapper.emitted('input')[0][0];
      expect(emittedValue.date.start).toBe('2023-01-01');
      expect(emittedValue.date.end).toBe('2023-01-01');
    });

    it('calculates datePickerMinDate correctly with valid start date', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.selectedDatesInternal = { start: '2023-01-15', end: null };

      expect(wrapper.vm.datePickerMinDate).toBe('2023-01-01');
    });

    it('calculates datePickerMaxDate correctly with valid start date', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.selectedDatesInternal = { start: '2023-01-15', end: null };

      expect(wrapper.vm.datePickerMaxDate).toBe('2023-01-01');
    });
  });

  describe('Relative date calculation tests', () => {
    it('returns the extensive date format correctly', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const mockMoment = moment();
      mockMoment.format.mockReturnValueOnce('2023-01-01');

      const result = wrapper.vm.getRelativeDate('2023-01-01', 'extensive');

      expect(result).toBeTruthy();
    });

    it('returns the digit date format correctly', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const mockMoment = moment();
      mockMoment.format.mockReturnValueOnce('2023-01-01');

      const result = wrapper.vm.getRelativeDate('today', 'digit');

      expect(result).toBe('2023-01-01');
    });

    it('returns empty string for invalid type', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const result = wrapper.vm.getRelativeDate('today', 'invalid');

      expect(result).toBe('');
    });
  });

  describe('Query params and filters value tests', () => {
    it('sets filter values from query params correctly for desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper(
        {},
        {},
        {
          contactUrn: 'test-contact',
          startDate: '2023-01-01',
          endDate: '2023-01-07',
        },
      );
      await flushPromises();

      expect(wrapper.vm.filterContact).toBe('test-contact');
      expect(wrapper.vm.filterDate.start).toBe('2023-01-01');
      expect(wrapper.vm.filterDate.end).toBe('2023-01-07');
    });

    it('sets filter values from query params correctly for mobile', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper(
        {},
        {},
        {
          contactUrn: 'test-contact',
          startDate: '2023-01-01',
        },
      );

      vi.fn().mockImplementation((date, type) => {
        if (date === '2023-01-01' && type === 'extensive')
          return 'last_12_months';
        return '';
      });

      await flushPromises();

      expect(wrapper.vm.filterContact).toBe('test-contact');
      const expectedDateObject = wrapper.vm.datesToFilter.find(
        (d) => d.value === 'last_12_months',
      );
      if (expectedDateObject) {
        expect(wrapper.vm.filterDate).toEqual([expectedDateObject]);
      } else {
        expect(wrapper.vm.filterDate).toEqual([
          wrapper.vm.datesToFilter.find(
            (obj) => obj.value === 'last_12_months',
          ),
        ]);
      }
    });

    it('sets values from value prop correctly for desktop', async () => {
      isMobile.mockReturnValue(false);
      const valueProps = {
        contact: 'Test Contact',
        sector: [{ value: 'sector1', label: 'Sector 1' }],
        tag: [{ value: 'tag1-prop', label: 'Tag 1 Prop' }],
        date: {
          start: '2023-01-01',
          end: '2023-01-07',
        },
      };

      Sector.tags.mockResolvedValue({
        results: [{ uuid: 'tag-from-api', name: 'Tag from API' }],
      });

      wrapper = createWrapper({ value: valueProps });
      await flushPromises();

      expect(wrapper.vm.filterContact).toBe('Test Contact');
      expect(wrapper.vm.filterSector).toEqual([
        { value: 'sector1', label: 'Sector 1' },
      ]);
      expect(wrapper.vm.filterTag).toEqual([]);
      expect(wrapper.vm.filterDate).toEqual({
        start: '2023-01-01',
        end: '2023-01-07',
      });
    });

    it('sets values from value prop correctly for mobile', async () => {
      isMobile.mockReturnValue(true);
      const valueProps = {
        contact: 'Test Contact',
        sector: [{ value: 'sector1', label: 'Sector 1' }],
        tag: [{ value: 'tag1-prop', label: 'Tag 1 Prop' }],
        date: {
          start: '2023-01-01',
          end: '2023-01-07',
        },
      };

      Sector.tags.mockResolvedValue({
        results: [{ uuid: 'tag-from-api', name: 'Tag from API' }],
      });

      const mockGetRelativeDateFn = (dateVal, type) => {
        if (dateVal === '2023-01-01' && type === 'extensive')
          return 'last_12_months';
        return '';
      };

      wrapper = createWrapper({ value: valueProps });
      wrapper.vm.getRelativeDate = mockGetRelativeDateFn;

      await flushPromises();

      expect(wrapper.vm.filterContact).toBe('Test Contact');
      expect(wrapper.vm.filterSector).toEqual([
        { value: 'sector1', label: 'Sector 1' },
      ]);
      expect(wrapper.vm.filterTag).toEqual([]);

      const expectedDateObject = wrapper.vm.datesToFilter.find(
        (d) => d.value === 'last_12_months',
      );
      if (expectedDateObject) {
        expect(wrapper.vm.filterDate).toEqual([expectedDateObject]);
      } else {
        expect(wrapper.vm.filterDate[0]?.value).toBe('last_12_months');
      }
    });
  });

  describe('Computed properties tests', () => {
    it('returns correct filterSectorsOptionAll value', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.filterSectorsOptionAll).toEqual({
        value: 'all',
        label: 'All',
      });
    });

    it('returns correct filterTagEmpty value', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.filterTagEmpty).toEqual({
        value: '',
        label: wrapper.vm.$t('filter.empty_tags'),
      });
    });

    it('returns correct filterTagDefault value', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.filterTagDefault).toEqual({
        value: '',
        label: wrapper.vm.$t('filter.by_tags'),
      });
    });

    it('returns correct filterDateDefault for desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.filterDateDefault).toEqual({
        start: '2023-01-01',
        end: '2023-01-01',
      });
    });

    it('returns correct filterDateDefault for mobile', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();

      expect(Array.isArray(wrapper.vm.filterDateDefault)).toBe(true);
    });

    it('returns correct isFiltersDefault value when filters are not default', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filterContact = 'Test Contact';
      wrapper.vm.filterSector = [{ value: 'all', label: 'All' }];
      wrapper.vm.filterTag = [];
      wrapper.vm.filterDate = wrapper.vm.filterDateDefault;

      expect(wrapper.vm.isFiltersDefault).toBe(false);
    });

    it('returns correct clearFiltersIconLeft for mobile', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.clearFiltersIconLeft).toBe('cached');
    });

    it('returns correct clearFiltersIconLeft for desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.clearFiltersIconLeft).toBe('');
    });

    it('returns correct clearFiltersType for mobile', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.clearFiltersType).toBe('tertiary');
    });

    it('returns correct clearFiltersType for desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.clearFiltersType).toBe('secondary');
    });
  });

  describe('Error handling tests', () => {
    it('handles errors in getSectors method', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      Sector.list.mockRejectedValue(new Error('API error'));

      wrapper = createWrapper();
      await flushPromises();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain(
        'The sectors could not be loaded',
      );

      consoleErrorSpy.mockRestore();
    });

    it('handles errors in getSectorTags method', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      Sector.tags.mockRejectedValue(new Error('API error'));

      wrapper = createWrapper();
      await flushPromises();

      await wrapper.vm.getSectorTags('sector1');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain(
        'The sector tags could not be loaded',
      );

      consoleErrorSpy.mockRestore();
    });

    it('handles case when getSectorTags is called with no sectorUuid', async () => {
      wrapper = createWrapper();
      await flushPromises();

      Sector.tags.mockClear();

      await wrapper.vm.getSectorTags(undefined);

      expect(wrapper.vm.tagsToFilter).toEqual([]);
      expect(Sector.tags).not.toHaveBeenCalled();
    });
  });
});
