import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import CustomBreakOption from '@/views/Settings/SettingsProjectOptions/CustomBreakOption.vue';
import i18n from '@/plugins/i18n';
import customStatus from '@/services/api/resources/chats/pauseStatus';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

vi.mock('@/services/api/resources/chats/pauseStatus', () => ({
  default: {
    getCustomBreakStatusTypeList: vi.fn(),
    deleteCustomStatusType: vi.fn(),
    createCustomStatusType: vi.fn(),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

vi.mock('@/store/modules/config', () => ({
  useConfig: () => ({
    project: {
      uuid: 'project-123',
    },
  }),
}));

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

describe('CustomBreakOption', () => {
  let wrapper;

  const createWrapper = () => {
    return mount(CustomBreakOption, {
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicButton: {
            template:
              '<button @click="$emit(\'click\', $event)"><slot /></button>',
            props: ['text', 'type', 'size', 'disabled', 'loading'],
          },
          UnnnicModalDialog: {
            template: `
                <div data-testid="modal-dialog">
                  <slot />
                  <button data-testid="primary-button" @click="$emit('primary-button-click')">Save</button>
                  <button data-testid="secondary-button" @click="$emit('secondary-button-click')">Cancel</button>
                </div>
              `,
            props: [
              'modelValue',
              'title',
              'primaryButtonProps',
              'secondaryButtonProps',
              'size',
            ],
            emits: [
              'primary-button-click',
              'secondary-button-click',
              'update:model-value',
            ],
          },
          UnnnicInput: {
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keyup.enter="$emit(\'keyup.enter\')" />',
            props: ['modelValue', 'label', 'placeholder', 'disabled'],
            emits: ['update:modelValue', 'input', 'keyup.enter'],
          },
          UnnnicIcon: true,
          UnnnicIconLoading: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the component', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should not show modal initially', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Modal Interactions', () => {
    it('should open modal when clicking the button', async () => {
      wrapper = createWrapper();
      customStatus.getCustomBreakStatusTypeList.mockResolvedValueOnce({
        results: [],
      });

      await wrapper.find('button').trigger('click');
      expect(wrapper.vm.showModal).toBe(true);
      expect(customStatus.getCustomBreakStatusTypeList).toHaveBeenCalled();
    });

    it('should close modal when clicking cancel', async () => {
      wrapper = createWrapper();
      wrapper.vm.showModal = true;
      await wrapper.vm.$nextTick();

      await wrapper.find('[data-testid="cancel-button"]').trigger('click');
      expect(wrapper.vm.showModal).toBe(false);
    });
  });

  describe('Status Management', () => {
    it('should load status list on modal open', async () => {
      const mockStatuses = [{ name: 'Break 1', uuid: '123', hasSaved: true }];
      customStatus.getCustomBreakStatusTypeList.mockResolvedValueOnce({
        results: mockStatuses,
      });

      wrapper = createWrapper();
      await wrapper.vm.openModal();

      expect(wrapper.vm.customBreaks).toEqual(mockStatuses);
      expect(wrapper.vm.isLoadingStatusData).toBe(false);
    });

    it('should handle status load error', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      customStatus.getCustomBreakStatusTypeList.mockRejectedValueOnce(
        new Error('API Error'),
      );

      wrapper = createWrapper();
      await wrapper.vm.openModal();

      expect(consoleError).toHaveBeenCalled();
      expect(wrapper.vm.isLoadingStatusData).toBe(false);

      consoleError.mockRestore();
    });

    it('should add new status', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreakName = 'Lunch Break';
      await wrapper.vm.addStatus();

      expect(wrapper.vm.customBreaks).toContainEqual({ name: 'Lunch Break' });
      expect(wrapper.vm.customBreakName).toBe('');
    });

    it('should not add empty status', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreakName = '   ';
      await wrapper.vm.addStatus();

      expect(wrapper.vm.customBreaks).toHaveLength(0);
    });

    it('should prevent adding duplicate status', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [{ name: 'Lunch Break' }];
      wrapper.vm.customBreakName = 'Lunch Break';

      await wrapper.vm.validateInput();
      expect(wrapper.vm.isDuplicate).toBe(true);
      expect(wrapper.vm.errorMessage).toBe(
        i18n.global.t('config_chats.custom_breaks.status_duplicate_name'),
      );
    });

    it('should enforce maximum status limit', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = Array(10).fill({ name: 'Break' });

      expect(wrapper.vm.isLimitReached).toBe(true);
      expect(wrapper.vm.errorMessage).toBe(
        i18n.global.t('config_chats.custom_breaks.status_exceeded_limit'),
      );
    });
  });

  describe('Status Removal', () => {
    it('should remove existing status', async () => {
      const mockStatus = { name: 'Break 1', uuid: '123' };
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [mockStatus];

      customStatus.deleteCustomStatusType.mockResolvedValueOnce({});
      await wrapper.vm.removeStatus(0);

      expect(customStatus.deleteCustomStatusType).toHaveBeenCalledWith({
        statusUuid: '123',
      });
      expect(wrapper.vm.customBreaks).toHaveLength(0);
    });

    it('should handle removal error', async () => {
      const mockStatus = { name: 'Break 1', uuid: '123' };
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [mockStatus];

      customStatus.deleteCustomStatusType.mockRejectedValueOnce(
        new Error('API Error'),
      );
      await wrapper.vm.removeStatus(0);

      expect(callUnnnicAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            type: 'error',
          }),
        }),
      );
      expect(wrapper.vm.customBreaks).toHaveLength(1);
    });
  });

  describe('Save Functionality', () => {
    it('should save status changes successfully', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [{ name: 'New Break' }];

      customStatus.createCustomStatusType.mockResolvedValueOnce({});
      await wrapper.vm.saveStatus();

      expect(customStatus.createCustomStatusType).toHaveBeenCalledWith({
        status: [
          {
            name: 'New Break',
            project: 'project-123',
          },
        ],
      });
      expect(callUnnnicAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            type: 'success',
          }),
        }),
      );
      expect(wrapper.vm.showModal).toBe(false);
    });

    it('should handle save error', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [{ name: 'New Break' }];

      customStatus.createCustomStatusType.mockRejectedValueOnce(
        new Error('API Error'),
      );
      await wrapper.vm.saveStatus();

      expect(callUnnnicAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            type: 'error',
          }),
        }),
      );
    });

    it('should not save when no changes are made', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [];

      await wrapper.vm.saveStatus();
      expect(customStatus.createCustomStatusType).not.toHaveBeenCalled();
    });
  });

  describe('Computed Properties', () => {
    it('should correctly compute canSave', async () => {
      wrapper = createWrapper();
      expect(wrapper.vm.canSave).toBe(false);

      wrapper.vm.customBreaks = [{ name: 'New Break' }];
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.canSave).toBe(true);
    });

    it('should correctly compute isLimitReached', () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = Array(10).fill({ name: 'Break' });
      expect(wrapper.vm.isLimitReached).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should validate duplicate names case-insensitively', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [{ name: 'Lunch Break' }];

      wrapper.vm.customBreakName = 'lunch break';
      await wrapper.vm.validateInput();
      expect(wrapper.vm.isDuplicate).toBe(true);

      wrapper.vm.customBreakName = 'LUNCH BREAK';
      await wrapper.vm.validateInput();
      expect(wrapper.vm.isDuplicate).toBe(true);
    });
  });

  describe('LocalStorage Functionality', () => {
    beforeEach(() => {
      Storage.prototype.setItem = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should update localStorage when status is saved', async () => {
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [{ name: 'New Break' }];

      customStatus.createCustomStatusType.mockResolvedValueOnce({});
      await wrapper.vm.saveStatus();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chats_settingsUpdated',
        expect.any(String),
      );
    });

    it('should update localStorage when status is removed', async () => {
      const mockStatus = { name: 'Break 1', uuid: '123' };
      wrapper = createWrapper();
      wrapper.vm.customBreaks = [mockStatus];

      customStatus.deleteCustomStatusType.mockResolvedValueOnce({});
      await wrapper.vm.removeStatus(0);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chats_settingsUpdated',
        expect.any(String),
      );
    });
  });
});
