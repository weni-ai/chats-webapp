import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { mount, flushPromises, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import ModalDeleteWithTransfer from '@/components/ModalDeleteWithTransfer.vue';
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
  vi.restoreAllMocks();
});

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn().mockResolvedValue({
      results: [
        { uuid: 'sector-1', name: 'Sector 1' },
        { uuid: 'sector-2', name: 'Sector 2' },
      ],
    }),
  },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    list: vi.fn().mockResolvedValue({
      results: [
        { uuid: 'queue-1', name: 'Queue 1' },
        { uuid: 'queue-2', name: 'Queue 2' },
      ],
    }),
  },
}));

describe('ModalDeleteWithTransfer.vue', () => {
  let wrapper;
  let pinia;

  const mountComponent = (props = {}) => {
    return mount(ModalDeleteWithTransfer, {
      props: {
        modelValue: true,
        type: 'sector',
        name: 'Test Sector',
        inProgressChatsCount: 0,
        isLoading: false,
        excludeSectorUuid: '',
        excludeQueueUuid: '',
        ...props,
      },
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  describe('isFormValid', () => {
    it('should be invalid when confirm text does not match name', () => {
      wrapper = mountComponent({ inProgressChatsCount: 0 });

      expect(wrapper.vm.isFormValid).toBe(false);
    });

    it('should be valid when name matches and no active chats', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 0 });

      wrapper.vm.confirmText = 'Test Sector';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFormValid).toBe(true);
    });

    it('should be invalid when transfer selected with active chats but no queue', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      wrapper.vm.selectedQueue = null;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFormValid).toBe(false);
    });

    it('should be invalid when transfer selected with active chats but empty queue value', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      wrapper.vm.selectedQueue = { value: '', label: '' };
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFormValid).toBe(false);
    });

    it('should be invalid when transfer selected with active chats but no sector', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = null;
      wrapper.vm.selectedQueue = { value: 'queue-1', label: 'Queue 1' };
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFormValid).toBe(false);
    });

    it('should be valid when transfer selected with active chats and both sector and queue set', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      await flushPromises();

      wrapper.vm.selectedQueue = { value: 'queue-1', label: 'Queue 1' };
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFormValid).toBe(true);
    });

    it('should be valid when end_all selected with active chats', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'end_all';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFormValid).toBe(true);
    });
  });

  describe('handleConfirm', () => {
    it('should not emit confirm when form is invalid', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Wrong Name';
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      expect(wrapper.emitted('confirm')).toBeUndefined();
    });

    it('should not emit confirm when transfer selected but queue is null', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      wrapper.vm.selectedQueue = null;
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      expect(wrapper.emitted('confirm')).toBeUndefined();
    });

    it('should not emit confirm when transfer selected but queue value is empty', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      wrapper.vm.selectedQueue = { value: '', label: '' };
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      expect(wrapper.emitted('confirm')).toBeUndefined();
    });

    it('should emit confirm with transfer payload when queue is valid', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      await flushPromises();

      wrapper.vm.selectedQueue = { value: 'queue-1', label: 'Queue 1' };
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      expect(wrapper.emitted('confirm')).toHaveLength(1);
      expect(wrapper.emitted('confirm')[0][0]).toEqual({
        action: 'transfer',
        transferSectorUuid: 'sector-1',
        transferQueueUuid: 'queue-1',
      });
    });

    it('should emit confirm with end_all payload', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'end_all';
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      expect(wrapper.emitted('confirm')).toHaveLength(1);
      expect(wrapper.emitted('confirm')[0][0]).toEqual({
        action: 'end_all',
      });
    });

    it('should emit confirm with empty payload when no active chats', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 0 });

      wrapper.vm.confirmText = 'Test Sector';
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      expect(wrapper.emitted('confirm')).toHaveLength(1);
      expect(wrapper.emitted('confirm')[0][0]).toEqual({});
    });

    it('should not include transfer data when no active chats even if selectedAction is transfer', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 0 });

      wrapper.vm.confirmText = 'Test Sector';
      wrapper.vm.selectedAction = 'transfer';
      await wrapper.vm.$nextTick();

      wrapper.vm.handleConfirm();

      const payload = wrapper.emitted('confirm')[0][0];
      expect(payload).toEqual({});
      expect(payload.transferQueueUuid).toBeUndefined();
      expect(payload.transferSectorUuid).toBeUndefined();
    });
  });

  describe('handleActionChange', () => {
    it('should reset sector and queue when switching to end_all', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      wrapper.vm.selectedQueue = { value: 'queue-1', label: 'Queue 1' };

      wrapper.vm.handleActionChange('end_all');

      expect(wrapper.vm.selectedSector).toBeNull();
      expect(wrapper.vm.selectedQueue).toBeNull();
      expect(wrapper.vm.selectedAction).toBe('end_all');
    });

    it('should not reset sector and queue when switching to transfer', async () => {
      wrapper = mountComponent({ inProgressChatsCount: 5 });
      await flushPromises();

      wrapper.vm.selectedSector = { value: 'sector-1', label: 'Sector 1' };
      wrapper.vm.selectedQueue = { value: 'queue-1', label: 'Queue 1' };

      wrapper.vm.handleActionChange('transfer');

      expect(wrapper.vm.selectedSector).toEqual({
        value: 'sector-1',
        label: 'Sector 1',
      });
      expect(wrapper.vm.selectedQueue).toEqual({
        value: 'queue-1',
        label: 'Queue 1',
      });
      expect(wrapper.vm.selectedAction).toBe('transfer');
    });
  });
});
