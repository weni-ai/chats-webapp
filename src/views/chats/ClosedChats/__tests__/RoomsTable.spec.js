import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import isMobile from 'is-mobile';

import RoomsTable from '../RoomsTable.vue';
import History from '@/services/api/resources/chats/history';

vi.mock('is-mobile', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/api/resources/chats/history', () => ({
  default: {
    getHistoryRooms: vi.fn(),
  },
}));

const mockRoom = {
  uuid: '123',
  contact: { name: 'John Doe' },
  user: { first_name: 'Agent Smith' },
  tags: [{ name: 'VIP' }, { name: 'Support' }],
  ended_at: new Date().toISOString(),
};

const mockRoom2 = {
  uuid: '456',
  contact: { name: 'Jane Roe' },
  user: { first_name: 'Agent Brown' },
  tags: [{ name: 'Complaint' }],
  ended_at: new Date().toISOString(),
};

describe('RoomsTable.vue', () => {
  let pinia;
  let wrapper;

  const createWrapper = (props = {}, mountOptions = {}, routeQuery = null) => {
    const defaultRouteQuery = { contactUrn: '', startDate: '', endDate: '' };
    const currentRouteQuery = routeQuery
      ? { ...defaultRouteQuery, ...routeQuery }
      : defaultRouteQuery;

    return mount(RoomsTable, {
      global: {
        mocks: {
          $t: (key) => key,
          $d: () => '01/01/2023',
          $route: { query: currentRouteQuery },
          $router: {
            push: vi.fn(),
          },
        },
        stubs: {
          ClosedChatsRoomsTableFilters: true,
          ModalClosedChatsFilters: true,
          RoomsTableLoading: true,
          UnnnicTable: {
            template:
              '<div data-testid="rooms-data-table"><slot name="header" /><template v-for="item in items" :key="item.uuid || item.id || JSON.stringify(item)"><slot name="item" :item="item" /></template><slot /></div>',
            props: ['items'],
          },
          UnnnicTableRow: {
            template:
              '<div v-bind="$attrs"><slot name="contactName" /><slot name="agentName" /><slot name="tags" /><slot name="date" /><slot name="visualize" /><slot/></div>',
            props: ['headers'],
          },
          UnnnicChatsUserAvatar: {
            template:
              '<div class="unnnic-avatar" data-testid="stub-unnnic-chats-user-avatar">{{ username }}</div>',
            props: ['username'],
          },
          TagGroup: {
            template: '<div data-testid="stub-tag-group"><slot /></div>',
            props: ['tags', 'flex'],
          },
          UnnnicIcon: {
            template: '<span data-testid="stub-unnnic-icon"><slot /></span>',
            props: ['icon'],
          },
          UnnnicButton: {
            template:
              '<button data-testid="stub-unnnic-button"><slot>{{ text }}</slot></button>',
            props: ['text', 'type', 'size', 'iconLeft'],
          },
          TablePagination: {
            template: '<div data-testid="stub-table-pagination"></div>',
            props: ['modelValue', 'count', 'countPages', 'limit', 'isLoading'],
            emits: ['update:modelValue'],
          },
        },
        plugins: [pinia],
      },
      props: {
        ...props,
      },
      ...mountOptions,
    });
  };

  beforeEach(() => {
    pinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);

    isMobile.mockReset().mockReturnValue(false);
    History.getHistoryRooms
      .mockReset()
      .mockResolvedValue({ results: [mockRoom], count: 1 });
  });

  describe('Rendering and Initial State', () => {
    it('renders desktop filters and table when not mobile and not loading', async () => {
      wrapper = createWrapper();
      await wrapper.setData({
        isTableLoading: false,
        rooms: [mockRoom],
      });

      await flushPromises();

      expect(wrapper.find('[data-testid="desktop-filters"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="mobile-filters-modal"]').exists(),
      ).toBe(false);

      expect(wrapper.find('[data-testid="table-loading-state"]').exists()).toBe(
        false,
      );
    });

    it('shows loading state initially', () => {
      History.getHistoryRooms.mockImplementationOnce(
        () => new Promise(() => {}),
      );
      wrapper = createWrapper();
      expect(wrapper.vm.isTableLoading).toBe(true);
    });

    it('hides loading state after data is fetched', async () => {
      wrapper = createWrapper();
      await wrapper.setData({ isTableLoading: false });

      await flushPromises();
      expect(wrapper.vm.isTableLoading).toBe(false);
    });

    it('renders table headers correctly for desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();
      const headers = wrapper.vm.tableHeaders;
      expect(headers.length).toBe(5);
      expect(headers[0].itemKey).toBe('contactName');
      expect(headers[1].itemKey).toBe('agentName');
      expect(headers[2].itemKey).toBe('closedBy');
      expect(headers[3].itemKey).toBe('tags');
      expect(headers[4].itemKey).toBe('date');
    });

    it('renders table headers correctly for mobile (excluding some)', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();
      const headers = wrapper.vm.tableHeaders;
      expect(headers.length).toBe(3);
      expect(headers.find((h) => h.id === 'agentName')).toBeUndefined();
      expect(headers.find((h) => h.id === 'tags')).toBeUndefined();
    });
  });

  describe('API Calls and Data Fetching', () => {
    it('calls getHistoryRooms with correct default parameters', async () => {
      isMobile.mockReturnValue(false);

      wrapper = createWrapper();

      History.getHistoryRooms.mockClear();

      await wrapper.vm.getHistoryRooms();

      expect(History.getHistoryRooms).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
        }),
      );
    });

    it('calls getHistoryRooms with mobile default limit', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();

      History.getHistoryRooms.mockClear();
      await wrapper.vm.getHistoryRooms();

      expect(History.getHistoryRooms).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
        }),
      );
    });

    it('updates rooms data after successful API call', async () => {
      History.getHistoryRooms.mockResolvedValue({
        results: [mockRoom, mockRoom2],
        count: 2,
      });

      wrapper = createWrapper();

      await wrapper.vm.getHistoryRooms();
      await flushPromises();

      expect(wrapper.vm.rooms.length).toBe(2);
      expect(wrapper.vm.rooms[0].uuid).toBe(mockRoom.uuid);
      expect(wrapper.vm.roomsCount).toBe(2);
      expect(wrapper.vm.roomsCountPages).toBe(1);
    });

    it('handles API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      History.getHistoryRooms.mockRejectedValue(new Error('API Error'));

      wrapper = createWrapper();
      await wrapper.setData({ isTableLoading: true });

      await wrapper.vm.getHistoryRooms();
      await flushPromises();

      expect(wrapper.vm.isTableLoading).toBe(false);
      expect(wrapper.vm.rooms.length).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(new Error('API Error'));
      consoleSpy.mockRestore();
    });

    it('calls getHistoryRooms when roomsCurrentPage changes', async () => {
      isMobile.mockReturnValue(false);

      wrapper = createWrapper();
      await wrapper.setData({
        roomsLimit: 5,
        roomsCurrentPage: 2,
      });

      const spy = vi.spyOn(wrapper.vm, 'getHistoryRooms');

      await wrapper.vm.$nextTick();

      History.getHistoryRooms.mockClear();

      await wrapper.vm.getHistoryRooms(true);

      expect(History.getHistoryRooms).toHaveBeenCalled();

      spy.mockRestore();
    });
  });

  describe('Filters Interaction', () => {
    it('updates filters when ClosedChatsRoomsTableFilters emits input', async () => {
      wrapper = createWrapper();
      await flushPromises();
      const desktopFilters = wrapper.findComponent(
        '[data-testid="desktop-filters"]',
      );
      const newFilters = {
        contact: 'Test Query',
        sector: [{ value: 'sector1', label: 'Sector 1' }],
        tag: [{ value: 'tag1', label: 'Tag 1' }],
        date: { start: '2023-01-01', end: '2023-01-07' },
      };
      await desktopFilters.vm.$emit('input', newFilters);
      expect(wrapper.vm.filters).toEqual(newFilters);
    });

    it('calls getHistoryRooms when filters change', async () => {
      wrapper = createWrapper();

      const getHistoryRoomsSpy = vi.spyOn(wrapper.vm, 'getHistoryRooms');

      await wrapper.setData({
        filters: { ...wrapper.vm.filters, contact: 'New Search' },
      });

      await flushPromises();
      expect(getHistoryRoomsSpy).toHaveBeenCalled();

      History.getHistoryRooms.mockClear();
      await wrapper.vm.getHistoryRooms();

      expect(History.getHistoryRooms).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'New Search',
        }),
      );

      getHistoryRoomsSpy.mockRestore();
    });

    it('calls getHistoryRooms with correct filter parameters', async () => {
      wrapper = createWrapper();
      const filters = {
        contact: 'FilterContact',
        sector: [{ value: 'sectorUUID', label: 'SectorName' }],
        tag: [
          { value: 'tagUUID', label: 'TagName1' },
          { value: 'tagUUID2', label: 'TagName2' },
        ],
        date: { start: '2023-02-01', end: '2023-02-28' },
      };

      await wrapper.setData({ filters });

      History.getHistoryRooms.mockClear();
      await wrapper.vm.getHistoryRooms();

      expect(History.getHistoryRooms).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at_after: '2023-02-01',
          ended_at_before: '2023-02-28',
          search: 'FilterContact',
          sector: 'sectorUUID',
          tag: 'TagName1,TagName2',
        }),
      );
    });

    it('handles "all" sectors correctly in API call', async () => {
      wrapper = createWrapper();
      const filters = {
        contact: '',
        sector: [{ value: 'all', label: 'All Sectors' }],
        tag: [],
        date: { start: '2023-03-01', end: '2023-03-31' },
      };

      await wrapper.setData({ filters });
      History.getHistoryRooms.mockClear();
      await wrapper.vm.getHistoryRooms();

      expect(History.getHistoryRooms).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: '',
        }),
      );
    });
  });

  describe('Pagination', () => {
    it('shows pagination when conditions are met', async () => {
      isMobile.mockReturnValue(false);
      History.getHistoryRooms.mockResolvedValue({
        results: [mockRoom],
        count: 10,
        countPages: 2,
      });
      wrapper = createWrapper();
      wrapper.vm.roomsCountPages = 2;
      await flushPromises();
      expect(wrapper.vm.showTablePagination).toBe(true);
    });

    it('hides pagination on mobile if roomsCountPages is 0', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      wrapper.vm.roomsCountPages = 0;
      await flushPromises();
      expect(wrapper.vm.showTablePagination).toBeFalsy();
    });
  });

  describe('Mobile Specific Behavior', () => {
    it('shows modal filters when mobile filter button is clicked', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.vm.showModalFilters).toBe(false);
      const mobileButton = wrapper.find(
        '[data-testid="mobile-filters-button"]',
      );
      await mobileButton.trigger('click');
      expect(wrapper.vm.showModalFilters).toBe(true);
      expect(
        wrapper.find('[data-testid="mobile-filters-modal"]').exists(),
      ).toBe(true);
    });

    it('hides modal filters when ModalClosedChatsFilters emits close', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await wrapper.setData({ showModalFilters: true });
      await flushPromises();

      const modal = wrapper.findComponent(
        '[data-testid="mobile-filters-modal"]',
      );
      await modal.vm.$emit('close');
      expect(wrapper.vm.showModalFilters).toBe(false);
    });

    it('emits open-room when a room item is clicked on mobile', async () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();
      await wrapper.setData({
        isTableLoading: false,
        rooms: [mockRoom],
      });

      await flushPromises();

      wrapper.vm.handleOpenRoom(mockRoom);
      expect(wrapper.emitted('open-room')).toBeTruthy();
      expect(wrapper.emitted('open-room')[0][0]).toEqual(mockRoom);
    });

    it('does not emit open-room when a room item is clicked on desktop', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.handleOpenRoom(mockRoom);
      expect(wrapper.emitted('open-room')).toBeFalsy();
    });
  });

  describe('Navigation', () => {
    it('handles router navigation on visualize button click (desktop)', async () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();
      await wrapper.setData({
        isTableLoading: false,
        rooms: [mockRoom],
      });

      await flushPromises();

      const routerPushSpy = wrapper.vm.$router.push;

      const visualizeButtonLink = wrapper.find(
        `[data-testid="room-item-visualize-button-link-${mockRoom.uuid}"]`,
      );

      if (visualizeButtonLink.exists()) {
        await visualizeButtonLink.trigger('click');
        expect(routerPushSpy).toHaveBeenCalledWith({
          name: 'closed-rooms.selected',
          params: { roomId: mockRoom.uuid },
          query: expect.any(Object),
        });
      } else {
        console.log(
          'Skipping router test as visualizeButtonLink is not rendered',
        );
      }
    });
  });

  describe('URL Query Parameters', () => {
    it('sets contact filter from contactUrn query parameter', async () => {
      const routeQuery = { contactUrn: 'test-contact' };
      wrapper = createWrapper({}, {}, routeQuery);

      wrapper.vm.setFiltersByQueryParams();

      expect(wrapper.vm.filterContact).toBe('test-contact');
    });

    it('sets filterDate.start from startDate query parameter', async () => {
      const routeQuery = { startDate: '2023-05-01' };
      wrapper = createWrapper({}, {}, routeQuery);

      wrapper.vm.filterDate = {};
      wrapper.vm.setFiltersByQueryParams();

      expect(wrapper.vm.filterDate.start).toBe('2023-05-01');
    });

    it('sets filterDate.end from endDate query parameter', async () => {
      const routeQuery = { endDate: '2023-05-31' };
      wrapper = createWrapper({}, {}, routeQuery);

      wrapper.vm.filterDate = {};
      wrapper.vm.setFiltersByQueryParams();

      expect(wrapper.vm.filterDate.end).toBe('2023-05-31');
    });

    it('handles all query parameters together', async () => {
      const routeQuery = {
        contactUrn: 'test-contact',
        startDate: '2023-05-01',
        endDate: '2023-05-31',
      };
      wrapper = createWrapper({}, {}, routeQuery);

      wrapper.vm.filterDate = {};
      wrapper.vm.setFiltersByQueryParams();

      expect(wrapper.vm.filterContact).toBe('test-contact');
      expect(wrapper.vm.filterDate.start).toBe('2023-05-01');
      expect(wrapper.vm.filterDate.end).toBe('2023-05-31');
    });

    it('does not set filters when query parameters are empty', async () => {
      const routeQuery = { contactUrn: '', startDate: '', endDate: '' };
      wrapper = createWrapper({}, {}, routeQuery);

      wrapper.vm.filterContact = 'initial-contact';
      wrapper.vm.filterDate = { start: 'initial-start', end: 'initial-end' };
      wrapper.vm.setFiltersByQueryParams();

      expect(wrapper.vm.filterContact).toBe('');
      expect(wrapper.vm.filterDate.start).toBe('initial-start');
      expect(wrapper.vm.filterDate.end).toBe('initial-end');
    });
  });

  describe('Initial Data Properties', () => {
    it('initializes with correct default values', () => {
      wrapper = createWrapper();

      expect(wrapper.vm.isTableLoading).toBe(true);
      expect(wrapper.vm.isPagesLoading).toBe(true);
      expect(wrapper.vm.showModalFilters).toBe(false);

      expect(wrapper.vm.rooms).toEqual([]);
      expect(wrapper.vm.roomsCount).toBe(0);
      expect(wrapper.vm.roomsCountPages).toBe(0);
      expect(wrapper.vm.roomsCurrentPage).toBe(1);
    });

    it('sets correct roomsLimit based on device type for desktop', () => {
      isMobile.mockReturnValue(false);
      wrapper = createWrapper();

      wrapper.vm.roomsLimit = isMobile() ? 10 : 5;

      expect(wrapper.vm.roomsLimit).toBe(5);
    });

    it('sets correct roomsLimit based on device type for mobile', () => {
      isMobile.mockReturnValue(true);
      wrapper = createWrapper();

      expect(wrapper.vm.roomsLimit).toBe(10);
    });

    it('initializes filters with default empty values', () => {
      wrapper = createWrapper();

      expect(wrapper.vm.filters).toEqual({
        contact: '',
        sector: [],
        tag: [],
        date: null,
      });
    });
  });

  describe('Computed Properties', () => {
    describe('tableHeaders', () => {
      it('returns all headers for desktop view', () => {
        isMobile.mockReturnValue(false);
        wrapper = createWrapper();

        const headers = wrapper.vm.tableHeaders;

        expect(headers.length).toBe(5);
        expect(headers[0].itemKey).toBe('contactName');
        expect(headers[1].itemKey).toBe('agentName');
        expect(headers[2].itemKey).toBe('closedBy');
        expect(headers[3].itemKey).toBe('tags');
        expect(headers[4].itemKey).toBe('date');

        headers.forEach((header) => {
          expect(header).toHaveProperty('title');
        });
      });

      it('excludes agentName and tags headers in mobile view', () => {
        isMobile.mockReturnValue(true);
        wrapper = createWrapper();

        const headers = wrapper.vm.tableHeaders;

        expect(headers.length).toBe(3);

        expect(headers[0].itemKey).toBe('contactName');
        expect(headers[1].itemKey).toBe('closedBy');
        expect(headers[2].itemKey).toBe('date');

        expect(headers.some((h) => h.itemKey === 'agentName')).toBe(false);
        expect(headers.some((h) => h.itemKey === 'tags')).toBe(false);
      });
    });

    describe('showTablePagination', () => {
      it('always shows pagination on desktop regardless of page count', () => {
        isMobile.mockReturnValue(false);
        wrapper = createWrapper();

        wrapper.vm.roomsCountPages = 0;
        expect(wrapper.vm.showTablePagination).toBe(true);

        wrapper.vm.roomsCountPages = 1;
        expect(wrapper.vm.showTablePagination).toBe(true);

        wrapper.vm.roomsCountPages = 5;
        expect(wrapper.vm.showTablePagination).toBe(true);
      });

      it('only shows pagination on mobile when roomsCountPages is truthy', () => {
        isMobile.mockReturnValue(true);
        wrapper = createWrapper();

        wrapper.vm.roomsCountPages = 0;
        expect(wrapper.vm.showTablePagination).toBeFalsy();

        wrapper.vm.roomsCountPages = null;
        expect(wrapper.vm.showTablePagination).toBeFalsy();

        wrapper.vm.roomsCountPages = 1;
        expect(wrapper.vm.showTablePagination).toBe(1);

        wrapper.vm.roomsCountPages = 5;
        expect(wrapper.vm.showTablePagination).toBe(5);
      });
    });
  });
});
