import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';

import SettingsSectors from '@/views/Settings/Sectors/index.vue';

import { useSettings } from '@/store/modules/settings';
import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    roomsCount: vi.fn().mockResolvedValue({ waiting: 5, in_service: 3 }),
    list: vi.fn(),
    deleteSector: vi.fn().mockResolvedValue({}),
  },
}));

import Sector from '@/services/api/resources/settings/sector';

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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'root', component: { template: '<div />' } },
    {
      path: '/settings/sectors',
      name: 'sectors',
      component: { template: '<div />' },
    },
    {
      path: '/settings/sectors/:uuid/edit',
      name: 'sectors.edit',
      component: { template: '<div />' },
    },
  ],
});

const createWrapper = () => {
  Sector.list.mockResolvedValue({
    results: mockSectors,
    next: '',
    previous: '',
  });

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      config: {
        project: { name: 'Project 1', uuid: 'proj-1' },
      },
      settings: {
        sectors: [],
        isLoadingSectors: false,
      },
    },
  });

  setActivePinia(pinia);

  return mount(SettingsSectors, {
    global: {
      plugins: [pinia, router],
      stubs: {
        ListOrdinator: {
          template: '<div data-testid="list-ordinator" />',
          props: ['modelValue', 'label'],
        },
        UnnnicInput: {
          template:
            '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['modelValue', 'iconLeft', 'size', 'label', 'placeholder'],
        },
        SectorCard: {
          name: 'SectorCard',
          template:
            '<div class="sector-card" data-testid="sector-card" @click="$emit(\'click\', sector)" />',
          props: ['sector'],
        },
        ModalDeleteWithTransfer: {
          name: 'ModalDeleteWithTransfer',
          template: '<div data-testid="modal-delete-sector" />',
          props: ['modelValue', 'name', 'type'],
        },
        UnnnicButton: {
          template: '<button type="button"><slot /></button>',
          props: ['text', 'type'],
        },
        UnnnicIconLoading: {
          template: '<div data-testid="icon-loading" />',
          props: ['size'],
        },
      },
    },
  });
};

describe('SettingsSectors (Sectors/index.vue)', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;
  let settingsStore;
  let pushSpy;

  beforeEach(async () => {
    vi.clearAllMocks();
    pushSpy = vi.spyOn(router, 'push');
    wrapper = createWrapper();
    settingsStore = useSettings();
    await flushPromises();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render a sector card per sector after load', () => {
      const sectorCards = wrapper.findAll('[data-testid="sector-card"]');
      expect(sectorCards.length).toBe(3);
    });

    it('should display the loading section when sectors are loading', async () => {
      settingsStore.isLoadingSectors = true;
      await wrapper.vm.$nextTick();

      const loadingSection = wrapper.find(
        '[data-testid="settings-sectors-loading-section"]',
      );

      expect(loadingSection.exists()).toBe(true);
    });

    it('should not display the loading section when sectors are not loading', () => {
      settingsStore.isLoadingSectors = false;

      const loadingSection = wrapper.find(
        '[data-testid="settings-sectors-loading-section"]',
      );

      expect(loadingSection.exists()).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should navigate to edit sector when a sector card is clicked', async () => {
      const sectorCards = wrapper.findAllComponents({ name: 'SectorCard' });

      await sectorCards[0].trigger('click');

      expect(pushSpy).toHaveBeenCalledWith({
        name: 'sectors.edit',
        params: { uuid: 'uuid-1' },
        query: { tab: 'general' },
      });
    });
  });

  describe('Delete sector modal', () => {
    it('should show delete modal after opening delete flow', async () => {
      const sectorCards = wrapper.findAllComponents({ name: 'SectorCard' });

      await sectorCards[0].vm.$emit('delete', mockSectors[0]);
      await flushPromises();
      await wrapper.vm.$nextTick();

      const deleteModal = wrapper.find('[data-testid="modal-delete-sector"]');
      expect(deleteModal.exists()).toBe(true);
    });
  });
});
