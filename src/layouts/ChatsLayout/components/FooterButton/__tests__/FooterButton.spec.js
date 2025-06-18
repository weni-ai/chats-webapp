import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FooterButton from '@/layouts/ChatsLayout/components/FooterButton/index.vue';
import { useRooms } from '@/store/modules/chats/rooms';
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
  const createWrapper = (selectedRooms = []) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const roomsStore = useRooms();
    roomsStore.selectedRoomsToTransfer = selectedRooms;

    return mount(FooterButton, {
      global: {
        plugins: [pinia],
        mocks: {
          $tc: (key, count) => `${key}_${count}`,
        },
        stubs: {
          UnnnicButton: true,
          ModalBulkTransfer: true,
        },
      },
    });
  };

  describe('Initial State and Store Integration', () => {
    it('should initialize correctly and integrate with store', () => {
      const wrapper = createWrapper(['room1', 'room2']);

      expect(wrapper.vm.isModalBulkTransferOpened).toBe(false);
      expect(wrapper.vm.selectedRoomsToTransfer).toEqual(['room1', 'room2']);
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

      await wrapper.setData({ isModalBulkTransferOpened: true });
      expect(wrapper.find('[data-testid="bulk-transfer-modal"]').exists()).toBe(
        true,
      );
    });
  });

  describe('Functionality', () => {
    it('should handle modal toggle method', () => {
      const wrapper = createWrapper(['room1']);

      expect(wrapper.vm.isModalBulkTransferOpened).toBe(false);

      wrapper.vm.handleModalBulkTransfer();
      expect(wrapper.vm.isModalBulkTransferOpened).toBe(true);

      wrapper.vm.handleModalBulkTransfer();
      expect(wrapper.vm.isModalBulkTransferOpened).toBe(false);
    });

    it('should handle button click event through component interaction', async () => {
      const wrapper = createWrapper(['room1']);
      const button = wrapper.findComponent({ name: 'UnnnicButton' });

      expect(wrapper.vm.isModalBulkTransferOpened).toBe(false);

      await button.vm.$emit('click');
      expect(wrapper.vm.isModalBulkTransferOpened).toBe(true);
    });

    it('should handle modal close event', async () => {
      const wrapper = createWrapper(['room1']);

      wrapper.vm.handleModalBulkTransfer();
      expect(wrapper.vm.isModalBulkTransferOpened).toBe(true);

      await wrapper.vm.$nextTick();

      wrapper.vm.handleModalBulkTransfer();
      expect(wrapper.vm.isModalBulkTransferOpened).toBe(false);
    });

    it('should handle different room counts correctly', () => {
      const wrapperSingle = createWrapper(['room1']);
      expect(wrapperSingle.vm.selectedRoomsToTransfer).toHaveLength(1);

      const wrapperMultiple = createWrapper([
        'room1',
        'room2',
        'room3',
        'room4',
      ]);
      expect(wrapperMultiple.vm.selectedRoomsToTransfer).toHaveLength(4);

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
});
