import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FooterButton from '@/layouts/ChatsLayout/components/FooterButton/index.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import i18n from '@/plugins/i18n';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

describe('FooterButton', () => {
  const createWrapper = (
    selectedRooms = [],
    activeTab = 'ongoing',
    {
      can_use_bulk_transfer = true,
      can_use_bulk_close = true,
      can_use_bulk_take = false,
      activeFeatures = [],
      isViewMode = false,
    } = {},
  ) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const roomsStore = useRooms();
    const configStore = useConfig();
    const featureFlagStore = useFeatureFlag();

    if (activeTab === 'ongoing') {
      roomsStore.selectedOngoingRooms = selectedRooms;
      roomsStore.selectedWaitingRooms = [];
    } else {
      roomsStore.selectedOngoingRooms = [];
      roomsStore.selectedWaitingRooms = selectedRooms;
    }
    roomsStore.activeTab = activeTab;

    configStore.project = {
      config: {
        can_use_bulk_transfer,
        can_use_bulk_close,
        can_use_bulk_take,
      },
    };

    featureFlagStore.featureFlags = {
      active_features: activeFeatures,
    };

    return mount(FooterButton, {
      props: { isViewMode },
      global: {
        plugins: [pinia],
        mocks: {
          $tc: (key, count) => `${key}_${count}`,
        },
        stubs: {
          UnnnicButton: true,
          UnnnicToolTip: {
            template: '<div><slot /></div>',
            props: ['enabled', 'text', 'side'],
          },
          ModalTakeOverRooms: true,
          ModalTransferRooms: true,
          ModalCloseRooms: true,
        },
      },
    });
  };

  describe('Initial State and Store Integration', () => {
    it('should initialize correctly and integrate with store for ongoing rooms', () => {
      const wrapper = createWrapper(['room1', 'room2'], 'ongoing');

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
      expect(wrapper.vm.currentSelectedRooms).toEqual(['room1', 'room2']);
      expect(
        wrapper.find('[data-testid="footer-button-container"]').exists(),
      ).toBe(true);
    });

    it('should initialize correctly and integrate with store for waiting rooms', () => {
      const wrapper = createWrapper(['room3', 'room4'], 'waiting');

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
      expect(wrapper.vm.currentSelectedRooms).toEqual(['room3', 'room4']);
      expect(
        wrapper.find('[data-testid="footer-button-container"]').exists(),
      ).toBe(true);
    });
  });

  describe('Conditional Rendering', () => {
    it('should show bulk transfer section when rooms are selected', () => {
      const wrapper = createWrapper(['room1', 'room2', 'room3']);

      expect(
        wrapper.find('[data-testid="bulk-transfer-section"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="transfer-button"]').exists()).toBe(
        true,
      );
      expect(wrapper.findComponent({ name: 'UnnnicButton' }).exists()).toBe(
        true,
      );
    });

    it('should hide bulk transfer section when no rooms selected', () => {
      const wrapper = createWrapper([]);

      expect(
        wrapper.find('[data-testid="bulk-transfer-section"]').exists(),
      ).toBe(false);
      expect(wrapper.find('[data-testid="transfer-button"]').exists()).toBe(
        false,
      );
    });

    it('should conditionally show modal based on state', async () => {
      const wrapper = createWrapper(['room1']);

      expect(wrapper.find('[data-testid="bulk-transfer-modal"]').exists()).toBe(
        false,
      );

      await wrapper.setData({ isModalTransferRoomsOpened: true });
      expect(wrapper.find('[data-testid="bulk-transfer-modal"]').exists()).toBe(
        true,
      );
    });
  });

  describe('Functionality', () => {
    it('should handle modal toggle method', () => {
      const wrapper = createWrapper(['room1']);

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);

      wrapper.vm.handleModalTransferRooms();
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(true);

      wrapper.vm.handleModalTransferRooms();
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
    });

    it('should handle button click event through component interaction', async () => {
      const wrapper = createWrapper(['room1']);
      const button = wrapper.findComponent({ name: 'UnnnicButton' });

      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);

      await button.vm.$emit('click');
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(true);
    });

    it('should handle modal close event', async () => {
      const wrapper = createWrapper(['room1']);

      wrapper.vm.handleModalTransferRooms();
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(true);

      await wrapper.vm.$nextTick();

      wrapper.vm.handleModalTransferRooms();
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
    });

    it('should handle different room counts correctly', () => {
      const wrapperSingle = createWrapper(['room1'], 'ongoing');
      expect(wrapperSingle.vm.currentSelectedRooms).toHaveLength(1);

      const wrapperMultiple = createWrapper(
        ['room1', 'room2', 'room3', 'room4'],
        'ongoing',
      );
      expect(wrapperMultiple.vm.currentSelectedRooms).toHaveLength(4);

      expect(wrapperSingle.vm.$tc('transfer_contact', 1)).toBe(
        'transfer_contact_1',
      );
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const wrapper = createWrapper(['room1', 'room2']);
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe('Take Over Button', () => {
    it('should show take over button on waiting tab with feature flag and config enabled', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(
        wrapper.find('[data-testid="take-over-button"]').exists(),
      ).toBe(true);
    });

    it('should hide take over button on ongoing tab', () => {
      const wrapper = createWrapper(['room1'], 'ongoing', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(
        wrapper.find('[data-testid="take-over-button"]').exists(),
      ).toBe(false);
    });

    it('should hide take over button when isViewMode is true', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
        isViewMode: true,
      });

      expect(
        wrapper.find('[data-testid="take-over-button"]').exists(),
      ).toBe(false);
    });

    it('should hide take over button when feature flag is inactive', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: [],
      });

      expect(
        wrapper.find('[data-testid="take-over-button"]').exists(),
      ).toBe(false);
    });

    it('should hide take over button when can_use_bulk_take config is false', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: false,
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(
        wrapper.find('[data-testid="take-over-button"]').exists(),
      ).toBe(false);
    });

    it('should toggle take over modal', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(false);

      wrapper.vm.handleModalTakeOverRooms();
      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(true);

      wrapper.vm.handleModalTakeOverRooms();
      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(false);
    });

    it('should show take over modal when opened', async () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(
        wrapper.find('[data-testid="bulk-take-over-modal"]').exists(),
      ).toBe(false);

      await wrapper.setData({ isModalTakeOverRoomsOpened: true });

      expect(
        wrapper.find('[data-testid="bulk-take-over-modal"]').exists(),
      ).toBe(true);
    });
  });

  describe('Modal safeguards', () => {
    it('should reset all modal states when activeTab changes', async () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      await wrapper.setData({
        isModalTakeOverRoomsOpened: true,
        isModalTransferRoomsOpened: true,
        isModalCloseRoomsOpened: true,
      });

      const roomsStore = useRooms();
      roomsStore.activeTab = 'ongoing';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(false);
      expect(wrapper.vm.isModalTransferRoomsOpened).toBe(false);
      expect(wrapper.vm.isModalCloseRoomsOpened).toBe(false);
    });

    it('should not open take over modal when selectedWaitingRooms is empty', () => {
      const wrapper = createWrapper([], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      wrapper.vm.handleModalTakeOverRooms();
      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(false);
    });

    it('should still allow closing take over modal when selectedWaitingRooms is empty', async () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        activeFeatures: ['weniChatsBulkTake'],
      });

      wrapper.vm.handleModalTakeOverRooms();
      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(true);

      const roomsStore = useRooms();
      roomsStore.selectedWaitingRooms = [];

      wrapper.vm.handleModalTakeOverRooms();
      expect(wrapper.vm.isModalTakeOverRoomsOpened).toBe(false);
    });
  });

  describe('Button type variants', () => {
    it('should render take over as primary when it is the only button', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        can_use_bulk_transfer: false,
        can_use_bulk_close: false,
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(wrapper.vm.takeOverButtonType).toBe('primary');
    });

    it('should render take over as secondary when end button is also present', () => {
      const wrapper = createWrapper(['room1'], 'waiting', {
        can_use_bulk_take: true,
        can_use_bulk_close: true,
        activeFeatures: ['weniChatsBulkTake', 'weniChatsBulkClose'],
      });

      expect(wrapper.vm.takeOverButtonType).toBe('secondary');
    });

    it('should render transfer as primary when end is not present', () => {
      const wrapper = createWrapper(['room1'], 'ongoing', {
        can_use_bulk_transfer: true,
        can_use_bulk_close: false,
      });

      expect(wrapper.vm.transferButtonType).toBe('primary');
    });

    it('should render transfer as secondary when end is present', () => {
      const wrapper = createWrapper(['room1'], 'ongoing', {
        can_use_bulk_transfer: true,
        can_use_bulk_close: true,
        activeFeatures: ['weniChatsBulkClose'],
      });

      expect(wrapper.vm.transferButtonType).toBe('secondary');
    });
  });
});
