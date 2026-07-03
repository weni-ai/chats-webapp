import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import SettingsSectors from '../index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';
import { useSettings } from '@/store/modules/settings';
import { handleConnectOverlay } from '@/utils/overlay';
import Rooms from '@/services/api/resources/settings/rooms';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/settings/rooms', () => ({
  default: {
    count: vi.fn(),
  },
}));

vi.mock('@/utils/overlay', () => ({
  handleConnectOverlay: vi.fn(),
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    UnnnicCallAlert: vi.fn(),
  };
});

const mockSectors = [
  {
    id: 1,
    uuid: 'sector-uuid-1',
    name: 'Beta Sector',
    created_on: '2024-01-02T00:00:00Z',
  },
  {
    id: 2,
    uuid: 'sector-uuid-2',
    name: 'Alpha Sector',
    created_on: '2024-01-01T00:00:00Z',
  },
];

const routes = [
  { path: '/settings/sectors', name: 'sectors' },
  {
    path: '/settings/sectors/:uuid/edit',
    name: 'sectors.edit',
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.push = vi.fn();

const SectorCardStub = {
  name: 'SectorCard',
  props: ['sector'],
  template: `
    <div
      class="sector-card-stub"
      data-testid="sector-card"
      @click="$emit('click', sector)"
    >
      {{ sector.name }}
      <button
        data-testid="delete-sector-button"
        @click.stop="$emit('delete', sector)"
      >
        delete
      </button>
    </div>
  `,
};

const ListOrdinatorStub = {
  name: 'ListOrdinator',
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <select
      data-testid="list-ordinator"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="alphabetical">alphabetical</option>
      <option value="newer">newer</option>
      <option value="older">older</option>
    </select>
  `,
};

const ModalDeleteWithTransferStub = {
  name: 'ModalDeleteWithTransfer',
  props: [
    'modelValue',
    'name',
    'excludeSectorUuid',
    'inProgressChatsCount',
    'isLoading',
    'type',
  ],
  emits: ['confirm', 'cancel', 'update:modelValue'],
  template: `
    <div v-if="modelValue" data-testid="modal-delete-sector">
      <span data-testid="modal-sector-name">{{ name }}</span>
      <span data-testid="modal-chats-count">{{ inProgressChatsCount }}</span>
      <button
        data-testid="confirm-delete-end-all"
        @click="$emit('confirm', { action: 'end_all' })"
      >
        end all
      </button>
      <button
        data-testid="confirm-delete-transfer"
        @click="$emit('confirm', { action: 'transfer', transferQueueUuid: 'queue-uuid-1' })"
      >
        transfer
      </button>
      <button data-testid="cancel-delete" @click="$emit('cancel')">
        cancel
      </button>
    </div>
  `,
};

const createWrapper = ({
  sectors = mockSectors,
  isLoadingSectors = false,
} = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      settings: {
        sectors,
        isLoadingSectors,
      },
    },
  });

  setActivePinia(pinia);

  return mount(SettingsSectors, {
    global: {
      plugins: [router, pinia],
      stubs: {
        SectorCard: SectorCardStub,
        ListOrdinator: ListOrdinatorStub,
        ModalDeleteWithTransfer: ModalDeleteWithTransferStub,
        UnnnicInput: {
          props: ['modelValue', 'label', 'placeholder', 'size', 'iconLeft'],
          template: `
            <input
              data-testid="sector-name-filter"
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          `,
        },
        UnnnicIconLoading: {
          template: '<div data-testid="loading-icon" />',
        },
        UnnnicButton: {
          props: ['text', 'type'],
          template: `
            <button data-testid="empty-state-action" @click="$emit('click')">
              {{ text }}
            </button>
          `,
        },
      },
    },
  });
};

describe('Settings/Sectors/index.vue', () => {
  useCompositionI18nInThisSpecFile();

  const { t } = i18n.global;

  let wrapper;
  let settingsStore;

  beforeEach(() => {
    vi.clearAllMocks();
    Rooms.count.mockResolvedValue({ waiting: 2, in_service: 3 });
  });

  describe('onMounted', () => {
    it('should call getSectors with force refresh on mount', () => {
      wrapper = createWrapper();
      settingsStore = useSettings();

      expect(settingsStore.getSectors).toHaveBeenCalledWith(true, true);
    });
  });

  describe('empty state', () => {
    it('should render loading icon when sectors are empty and loading', () => {
      wrapper = createWrapper({ sectors: [], isLoadingSectors: true });

      expect(wrapper.find('[data-testid="loading-icon"]').exists()).toBe(true);
      expect(wrapper.find('.settings-sectors--empty__title').exists()).toBe(
        false,
      );
    });

    it('should render empty state content when there are no sectors', () => {
      wrapper = createWrapper({ sectors: [], isLoadingSectors: false });

      expect(wrapper.find('.settings-sectors--empty__title').exists()).toBe(
        true,
      );
      expect(wrapper.find('.settings-sectors--empty__subtitle').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="empty-state-action"]').exists()).toBe(
        true,
      );
    });

    it('should emit open-new-sector-modal when empty state action is clicked', async () => {
      wrapper = createWrapper({ sectors: [], isLoadingSectors: false });

      await wrapper.find('[data-testid="empty-state-action"]').trigger('click');

      expect(wrapper.emitted('open-new-sector-modal')).toBeTruthy();
    });
  });

  describe('sectors list', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should render the sectors list title and cards', () => {
      expect(wrapper.find('.settings-sectors__title').exists()).toBe(true);
      expect(wrapper.findAll('[data-testid="sector-card"]')).toHaveLength(2);
    });

    it('should show loading section when sectors are being loaded', async () => {
      settingsStore = useSettings();
      settingsStore.isLoadingSectors = true;
      await wrapper.vm.$nextTick();

      expect(
        wrapper
          .find('[data-testid="settings-sectors-loading-section"]')
          .exists(),
      ).toBe(true);
    });

    it('should navigate to sector edit page when a sector card is clicked', async () => {
      await wrapper.findAll('[data-testid="sector-card"]')[0].trigger('click');

      expect(router.push).toHaveBeenCalledWith({
        name: 'sectors.edit',
        params: { uuid: 'sector-uuid-2' },
        query: { tab: 'general' },
      });
    });

    it('should order sectors alphabetically by default', () => {
      const cards = wrapper.findAll('[data-testid="sector-card"]');

      expect(cards[0].text()).toContain('Alpha Sector');
      expect(cards[1].text()).toContain('Beta Sector');
    });

    it('should order sectors by creation date when newer is selected', async () => {
      await wrapper.find('[data-testid="list-ordinator"]').setValue('newer');
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll('[data-testid="sector-card"]');

      expect(cards[0].text()).toContain('Beta Sector');
      expect(cards[1].text()).toContain('Alpha Sector');
    });

    it('should filter sectors by name', async () => {
      await wrapper
        .find('[data-testid="sector-name-filter"]')
        .setValue('alpha');
      await wrapper.vm.$nextTick();

      const cards = wrapper.findAll('[data-testid="sector-card"]');

      expect(cards).toHaveLength(1);
      expect(cards[0].text()).toContain('Alpha Sector');
    });
  });

  describe('delete sector modal', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await wrapper
        .find('[data-testid="delete-sector-button"]')
        .trigger('click');
      await flushPromises();
    });

    it('should open delete modal with room count from API', () => {
      expect(handleConnectOverlay).toHaveBeenCalledWith(true);
      expect(Rooms.count).toHaveBeenCalledWith({ sector: 'sector-uuid-2' });
      expect(wrapper.find('[data-testid="modal-delete-sector"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="modal-chats-count"]').text()).toBe(
        '5',
      );
      expect(wrapper.find('[data-testid="modal-sector-name"]').text()).toBe(
        'Alpha Sector',
      );
    });

    it('should set room count to zero when Rooms.count fails', async () => {
      Rooms.count.mockRejectedValueOnce(new Error('API error'));

      wrapper = createWrapper();
      await wrapper
        .find('[data-testid="delete-sector-button"]')
        .trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="modal-chats-count"]').text()).toBe(
        '0',
      );
    });

    it('should close delete modal and reset overlay on cancel', async () => {
      await wrapper.find('[data-testid="cancel-delete"]').trigger('click');
      await wrapper.vm.$nextTick();

      expect(handleConnectOverlay).toHaveBeenCalledWith(false);
      expect(wrapper.find('[data-testid="modal-delete-sector"]').exists()).toBe(
        false,
      );
    });
  });

  describe('handlerDeleteSector', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      settingsStore = useSettings();
      await wrapper
        .find('[data-testid="delete-sector-button"]')
        .trigger('click');
      await flushPromises();
    });

    it('should delete sector with end_all option and show success alert', async () => {
      settingsStore.deleteSector.mockResolvedValueOnce();

      await wrapper
        .find('[data-testid="confirm-delete-end-all"]')
        .trigger('click');
      await flushPromises();

      expect(settingsStore.deleteSector).toHaveBeenCalledWith('sector-uuid-2', {
        endAllChats: true,
      });
      expect(router.push).toHaveBeenCalledWith({ name: 'sectors' });
      expect(UnnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: t('delete_modal.sector_success'),
          type: 'success',
        },
        seconds: 5,
      });
      expect(handleConnectOverlay).toHaveBeenCalledWith(false);
      expect(wrapper.find('[data-testid="modal-delete-sector"]').exists()).toBe(
        false,
      );
    });

    it('should delete sector with transfer option', async () => {
      settingsStore.deleteSector.mockResolvedValueOnce();

      await wrapper
        .find('[data-testid="confirm-delete-transfer"]')
        .trigger('click');
      await flushPromises();

      expect(settingsStore.deleteSector).toHaveBeenCalledWith('sector-uuid-2', {
        transferToQueue: 'queue-uuid-1',
      });
    });

    it('should show generic error alert when delete fails', async () => {
      settingsStore.deleteSector.mockRejectedValueOnce(
        new Error('Delete failed'),
      );

      await wrapper
        .find('[data-testid="confirm-delete-end-all"]')
        .trigger('click');
      await flushPromises();

      expect(UnnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: t('delete_modal.sector_error'),
          type: 'error',
        },
        seconds: 5,
      });
      expect(handleConnectOverlay).toHaveBeenCalledWith(false);
    });

    it('should show transfer conflict error alert when delete returns 409', async () => {
      settingsStore.deleteSector.mockRejectedValueOnce({
        response: { status: 409 },
      });

      await wrapper
        .find('[data-testid="confirm-delete-end-all"]')
        .trigger('click');
      await flushPromises();

      expect(UnnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: t('delete_modal.transfer_error_sector'),
          type: 'error',
        },
        seconds: 5,
      });
    });
  });
});
