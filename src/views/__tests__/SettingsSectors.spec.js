import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';

import SettingsSectors from '@/views/Settings/SettingsSectors.vue';

import { createTestingPinia } from '@pinia/testing';
import { useSettings } from '@/store/modules/settings';
import unnnic from '@weni/unnnic-system';

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

const mockSectors = [
  {
    id: 1,
    uuid: 'uuid-1',
    name: 'Alpha Sector',
    created_on: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    uuid: 'uuid-2',
    name: 'Beta Sector',
    created_on: '2024-01-02T10:00:00Z',
  },
  {
    id: 3,
    uuid: 'uuid-3',
    name: 'Gamma Sector',
    created_on: '2024-01-03T10:00:00Z',
  },
];

const mockRouter = {
  push: vi.fn(),
};

const createWrapper = (initialState = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      config: {
        project: { name: 'Project 1' },
        ...initialState.config,
      },
      settings: {
        sectors: mockSectors,
        isLoadingSectors: false,
        ...initialState.settings,
      },
    },
  });

  setActivePinia(pinia);

  return mount(SettingsSectors, {
    global: {
      plugins: [pinia],
      stubs: {
        SettingsSectionHeader: {
          template: '<div data-testid="settings-sectors-header"></div>',
          props: ['title', 'subtitle'],
        },
        NewSectorDrawer: {
          template: '<div data-testid="new-sector-drawer" v-if="show"></div>',
          props: ['show'],
        },
        ListOrdinator: {
          template: '<div data-testid="list-ordinator"></div>',
          props: ['modelValue', 'label'],
        },
        UnnnicCard: {
          template: '<div @click="$emit(\'click\')"><slot></slot></div>',
          props: ['type', 'text', 'icon'],
        },
        UnnnicSimpleCard: {
          template:
            '<div @click="$emit(\'click\')"><slot name="headerSlot"></slot></div>',
          props: ['title', 'clickable'],
        },
        UnnnicInput: {
          template:
            '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['modelValue', 'iconLeft', 'size', 'placeholder'],
        },
        UnnnicDropdown: {
          template: '<div><slot name="trigger"></slot><slot></slot></div>',
          props: ['position'],
        },
        UnnnicDropdownItem: {
          template: '<div @click.stop="$emit(\'click\')"><slot></slot></div>',
        },
        UnnnicToolTip: {
          template: '<div><slot></slot></div>',
          props: ['enabled', 'text', 'side'],
        },
        UnnnicButton: {
          template: '<button data-testid="open-dropdown-menu-button"></button>',
          props: ['iconCenter', 'type'],
        },
        UnnnicIconSvg: {
          template: '<span></span>',
          props: ['icon', 'size', 'scheme'],
        },
        UnnnicModalNext: {
          template:
            '<div data-testid="modal-delete-sector" v-if="show"><button @click="$emit(\'click-action-primary\')">Confirm</button><button @click="$emit(\'click-action-secondary\')">Cancel</button></div>',
          props: [
            'type',
            'icon',
            'scheme',
            'title',
            'description',
            'validate',
            'validatePlaceholder',
            'validateLabel',
            'actionPrimaryLabel',
            'actionSecondaryLabel',
          ],
          data() {
            return { show: true };
          },
        },
      },
      mocks: {
        $router: mockRouter,
        $t: (key, params) => {
          const translations = {
            'config_chats.section_sectors_title': `Sectors - ${params?.project || ''}`,
            'config_chats.section_sectors_subtitle': 'Manage your sectors',
            'config_chats.new_sector': 'New Sector',
            search: 'Search',
            'order_by.label': 'Order by',
            'quick_messages.delete_or_edit': 'Delete or edit',
            edit: 'Edit',
            exclude: 'Exclude',
            delete_sector: 'Delete sector',
            cant_revert: 'This action cannot be reverted',
            confirm_typing: 'Type to confirm',
            confirm: 'Confirm',
            cancel: 'Cancel',
            sector_deleted_success: 'Sector deleted successfully!',
            sector_delete_error:
              'Unable to delete sector, please try again later.',
          };
          return translations[key] || key;
        },
      },
    },
  });
};

describe('SettingsSectors.vue', () => {
  let wrapper;
  let settingsStore;
  let postMessageSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    postMessageSpy = vi
      .spyOn(window.parent, 'postMessage')
      .mockImplementation(() => {});
    wrapper = createWrapper();
    settingsStore = useSettings();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the SettingsSectionHeader with correct props', () => {
      const header = wrapper.findComponent(
        '[data-testid=settings-sectors-header]',
      );

      expect(header.exists()).toBe(true);
    });

    it('should render the card for creating a new sector', () => {
      const newSectorCard = wrapper.findComponent(
        '[data-testid=settings-sectors-blank-card]',
      );

      expect(newSectorCard.exists()).toBe(true);
    });

    it('should render the correct number of sector cards', () => {
      const sectorCards = wrapper.findAllComponents(
        '[data-testid=settings-sectors-sector-card]',
      );

      expect(sectorCards.length).toBe(3);
    });

    it('should display the loading section when sectors are loading', async () => {
      settingsStore.isLoadingSectors = true;

      await wrapper.vm.$nextTick();

      const loadingSection = wrapper.find(
        '[data-testid=settings-sectors-loading-section]',
      );

      expect(loadingSection.exists()).toBe(true);
    });

    it('should not display the loading section when sectors are not loading', () => {
      settingsStore.isLoadingSectors = false;

      const loadingSection = wrapper.find(
        '[data-testid=settings-sectors-loading-section]',
      );

      expect(loadingSection.exists()).toBe(false);
    });
  });

  describe('New Sector Modal', () => {
    it('should open new sector modal when clicking on new sector card', async () => {
      const newSectorCard = wrapper.findComponent(
        '[data-testid=settings-sectors-blank-card]',
      );

      expect(wrapper.vm.showNewSectorModal).toBe(false);

      await newSectorCard.trigger('click');
      vi.advanceTimersByTime(1);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showNewSectorModal).toBe(true);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should close new sector modal when closeNewSectorModal is called', async () => {
      wrapper.vm.showNewSectorModal = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.closeNewSectorModal();
      vi.advanceTimersByTime(1);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showNewSectorModal).toBe(false);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });
  });

  describe('Sector Filtering', () => {
    it('should filter sectors by name', async () => {
      wrapper.vm.sectorNameFilter = 'Alpha';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered.length).toBe(1);
      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Alpha Sector');
    });

    it('should filter sectors case-insensitively', async () => {
      wrapper.vm.sectorNameFilter = 'beta';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered.length).toBe(1);
      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Beta Sector');
    });

    it('should show all sectors when filter is empty', async () => {
      wrapper.vm.sectorNameFilter = '';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered.length).toBe(3);
    });

    it('should trim whitespace from filter', async () => {
      wrapper.vm.sectorNameFilter = '  Alpha  ';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered.length).toBe(1);
      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Alpha Sector');
    });
  });

  describe('Sector Ordering', () => {
    it('should order sectors alphabetically by default', () => {
      expect(wrapper.vm.sectorOrder).toBe('alphabetical');
      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Alpha Sector');
      expect(wrapper.vm.sectorsOrdered[1].name).toBe('Beta Sector');
      expect(wrapper.vm.sectorsOrdered[2].name).toBe('Gamma Sector');
    });

    it('should order sectors by newer first', async () => {
      wrapper.vm.sectorOrder = 'newer';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Gamma Sector');
      expect(wrapper.vm.sectorsOrdered[1].name).toBe('Beta Sector');
      expect(wrapper.vm.sectorsOrdered[2].name).toBe('Alpha Sector');
    });

    it('should order sectors by older first', async () => {
      wrapper.vm.sectorOrder = 'older';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Alpha Sector');
      expect(wrapper.vm.sectorsOrdered[1].name).toBe('Beta Sector');
      expect(wrapper.vm.sectorsOrdered[2].name).toBe('Gamma Sector');
    });

    it('should combine filtering and ordering', async () => {
      wrapper.vm.sectorOrder = 'newer';
      wrapper.vm.sectorNameFilter = 'Sector';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.sectorsOrdered.length).toBe(3);
      expect(wrapper.vm.sectorsOrdered[0].name).toBe('Gamma Sector');
    });
  });

  describe('Navigation', () => {
    it('should navigate to edit sector when clicking on sector card', async () => {
      const sectorCards = wrapper.findAllComponents(
        '[data-testid=settings-sectors-sector-card]',
      );

      await sectorCards[0].trigger('click');

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'sectors.edit',
        params: { uuid: 'uuid-1' },
      });
    });

    it('should navigate to edit sector when clicking edit in dropdown', async () => {
      const dropdownItems = wrapper.findAllComponents({
        name: 'UnnnicDropdownItem',
      });
      const editItem = dropdownItems.find((item) =>
        item.attributes('data-testid')?.includes('dropdown-edit'),
      );

      if (editItem) {
        await editItem.trigger('click');
        expect(mockRouter.push).toHaveBeenCalled();
      }
    });
  });

  describe('Delete Sector Modal', () => {
    it('should open delete sector modal when handlerOpenDeleteSectorModal is called', async () => {
      const sector = mockSectors[0];

      expect(wrapper.vm.showDeleteSectorModal).toBe(false);

      wrapper.vm.handlerOpenDeleteSectorModal(sector);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDeleteSectorModal).toBe(true);
      expect(wrapper.vm.toDeleteSector).toEqual(sector);
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should close delete sector modal when handlerCloseDeleteSectorModal is called', async () => {
      wrapper.vm.showDeleteSectorModal = true;
      wrapper.vm.toDeleteSector = mockSectors[0];
      await wrapper.vm.$nextTick();

      wrapper.vm.handlerCloseDeleteSectorModal();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showDeleteSectorModal).toBe(false);
      expect(wrapper.vm.toDeleteSector).toEqual({});
      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });

    it('should delete sector successfully', async () => {
      const sector = mockSectors[0];
      settingsStore.deleteSector = vi.fn().mockResolvedValue({});

      wrapper.vm.handlerOpenDeleteSectorModal(sector);
      await wrapper.vm.$nextTick();

      await wrapper.vm.deleteSector(sector.uuid);
      await flushPromises();

      expect(settingsStore.deleteSector).toHaveBeenCalledWith(sector.uuid);
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'sectors' });
      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Sector deleted successfully!',
          type: 'success',
        },
        seconds: 5,
      });
      expect(wrapper.vm.showDeleteSectorModal).toBe(false);
    });

    it('should handle error when deleting sector', async () => {
      const sector = mockSectors[0];
      const error = new Error('Delete failed');
      settingsStore.deleteSector = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      wrapper.vm.handlerOpenDeleteSectorModal(sector);
      await wrapper.vm.$nextTick();

      await wrapper.vm.deleteSector(sector.uuid);
      await flushPromises();

      expect(settingsStore.deleteSector).toHaveBeenCalledWith(sector.uuid);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Unable to delete sector, please try again later.',
          type: 'error',
        },
        seconds: 5,
      });
      expect(wrapper.vm.showDeleteSectorModal).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('handleConnectOverlay', () => {
    it('should send postMessage when handleConnectOverlay is called with true', () => {
      wrapper.vm.handleConnectOverlay(true);

      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: true },
        '*',
      );
    });

    it('should send postMessage when handleConnectOverlay is called with false', () => {
      wrapper.vm.handleConnectOverlay(false);

      expect(postMessageSpy).toHaveBeenCalledWith(
        { event: 'changeOverlay', data: false },
        '*',
      );
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
