import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CountryHolidaysModal from '../CountryHolidaysModal.vue';
import Sector from '@/services/api/resources/settings/sector';
import unnnic from '@weni/unnnic-system';
import moment from 'moment';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    updateCountryHoliday: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

describe('CountryHolidaysModal', () => {
  let wrapper;

  const defaultHolidays = [
    { date: '2024-01-01', name: 'New Year' },
    { date: '2024-12-25', name: 'Christmas' },
    { date: '2024-07-04', name: 'Independence Day' },
  ];

  const defaultEnableHolidays = ['2024-01-01', '2024-12-25'];

  const createWrapper = (props = {}) => {
    return mount(CountryHolidaysModal, {
      props: {
        holidays: defaultHolidays,
        enableHolidays: defaultEnableHolidays,
        isEditing: false,
        sectorUuid: '',
        countryCode: 'US',
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicModalDialog: {
            template: `
              <div data-testid="modal-dialog">
                <div data-testid="modal-title">{{ title }}</div>
                <div data-testid="modal-close" @click="$emit('update:model-value', false)">×</div>
                <slot />
                <button 
                  data-testid="primary-button" 
                  :disabled="primaryButtonProps?.loading"
                  @click="$emit('primary-button-click')"
                >
                  {{ primaryButtonProps?.text }}
                </button>
              </div>
            `,
            props: [
              'modelValue',
              'title',
              'showCloseIcon',
              'primaryButtonProps',
            ],
            emits: ['update:model-value', 'primary-button-click'],
          },
          UnnnicSwitch: {
            template: `
              <div data-testid="switch" @click="handleClick">
                <span data-testid="switch-text">{{ textRight }}</span>
                <span data-testid="switch-value">{{ modelValue ? 'on' : 'off' }}</span>
              </div>
            `,
            props: ['modelValue', 'textRight'],
            emits: ['update:model-value'],
            methods: {
              handleClick() {
                this.$emit('update:model-value', !this.modelValue);
              },
            },
          },
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the modal correctly', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="modal-dialog"]').exists()).toBe(true);
    });

    it('should display the modal title with country name', () => {
      wrapper = createWrapper({ countryCode: 'US' });
      const title = wrapper.find('[data-testid="modal-title"]');
      expect(title.text()).toContain('Holidays in United States');
    });

    it('should display the modal title with default label when countryCode is empty', () => {
      wrapper = createWrapper({ countryCode: '' });
      const title = wrapper.find('[data-testid="modal-title"]');
      expect(title.text()).toContain('Holidays in Country');
    });

    it('should display the description', () => {
      wrapper = createWrapper();
      const body = wrapper.find('.country-holidays-modal__body');
      expect(body.text()).toContain(
        'If necessary, you can disable each of the holidays and they will be considered as a business day',
      );
    });

    it('should render switches for all holidays', () => {
      wrapper = createWrapper();
      const switches = wrapper.findAll('[data-testid="switch"]');
      expect(switches).toHaveLength(3);
    });
  });

  describe('Holiday Label Formatting', () => {
    it('should format holiday label with date and name', () => {
      wrapper = createWrapper();
      const holiday = { date: '2024-01-01', name: 'New Year' };
      const formatted = wrapper.vm.formatHolidayLabel(holiday);
      const expectedDate = moment('2024-01-01').format('L');
      expect(formatted).toBe(`${expectedDate} - New Year`);
    });

    it('should return only name when date is not provided', () => {
      wrapper = createWrapper();
      const holiday = { name: 'Holiday without date' };
      const formatted = wrapper.vm.formatHolidayLabel(holiday);
      expect(formatted).toBe('Holiday without date');
    });
  });

  describe('Holiday Selection', () => {
    it('should initialize with enableHolidays prop', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.internalEnableHolidays).toEqual(defaultEnableHolidays);
    });

    it('should display enabled holidays as checked', () => {
      wrapper = createWrapper();
      const switches = wrapper.findAll('[data-testid="switch"]');
      const firstSwitch = switches[0];
      expect(firstSwitch.find('[data-testid="switch-value"]').text()).toBe(
        'on',
      );
    });

    it('should display disabled holidays as unchecked', () => {
      wrapper = createWrapper();
      const switches = wrapper.findAll('[data-testid="switch"]');
      const thirdSwitch = switches[2];
      expect(thirdSwitch.find('[data-testid="switch-value"]').text()).toBe(
        'off',
      );
    });

    it('should toggle holiday selection when switch is clicked', async () => {
      wrapper = createWrapper();
      const switches = wrapper.findAll('[data-testid="switch"]');
      const firstSwitch = switches[0];

      expect(wrapper.vm.internalEnableHolidays).toContain('2024-01-01');

      await firstSwitch.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.internalEnableHolidays).not.toContain('2024-01-01');
    });

    it('should add holiday to internalEnableHolidays when enabling', async () => {
      wrapper = createWrapper();
      const switches = wrapper.findAll('[data-testid="switch"]');
      const thirdSwitch = switches[2];

      expect(wrapper.vm.internalEnableHolidays).not.toContain('2024-07-04');

      await thirdSwitch.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.internalEnableHolidays).toContain('2024-07-04');
    });
  });

  describe('Save - Not Editing Mode', () => {
    it('should emit update:enable-holidays and update:disabled-holidays events', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.handleSave();

      expect(wrapper.emitted('update:enable-holidays')).toBeTruthy();
      expect(wrapper.emitted('update:disabled-holidays')).toBeTruthy();
    });

    it('should emit correct enabled holidays', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.handleSave();

      const enabledEvent = wrapper.emitted('update:enable-holidays')[0];
      expect(enabledEvent[0]).toEqual(['2024-01-01', '2024-12-25']);
    });

    it('should emit correct disabled holidays', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.handleSave();

      const disabledEvent = wrapper.emitted('update:disabled-holidays')[0];
      expect(disabledEvent[0]).toEqual(['2024-07-04']);
    });

    it('should emit close event after save', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.handleSave();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should not call Sector.updateCountryHoliday when not editing', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.handleSave();

      expect(Sector.updateCountryHoliday).not.toHaveBeenCalled();
    });
  });

  describe('Save - Editing Mode (Success)', () => {
    it('should call Sector.updateCountryHoliday when editing', async () => {
      Sector.updateCountryHoliday.mockResolvedValue({});

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      await wrapper.vm.handleSave();

      expect(Sector.updateCountryHoliday).toHaveBeenCalledWith('sector-123', {
        enabled_holidays: ['2024-01-01', '2024-12-25'],
        disabled_holidays: ['2024-07-04'],
      });
    });

    it('should show success alert after successful update', async () => {
      Sector.updateCountryHoliday.mockResolvedValue({});

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      await wrapper.vm.handleSave();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Country holidays updated successfully.',
          type: 'success',
        },
      });
    });

    it('should set isLoadingRequest to true during save', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      Sector.updateCountryHoliday.mockReturnValue(promise);

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      const savePromise = wrapper.vm.handleSave();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoadingRequest).toBe(true);

      resolvePromise();
      await savePromise;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoadingRequest).toBe(false);
    });

    it('should emit events after successful update', async () => {
      Sector.updateCountryHoliday.mockResolvedValue({});

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      await wrapper.vm.handleSave();

      expect(wrapper.emitted('update:enable-holidays')).toBeTruthy();
      expect(wrapper.emitted('update:disabled-holidays')).toBeTruthy();
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Save - Editing Mode (Error)', () => {
    it('should show error alert when update fails', async () => {
      const error = new Error('Update failed');
      Sector.updateCountryHoliday.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      await wrapper.vm.handleSave();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Failed to update country holidays, please try again.',
          type: 'error',
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });

    it('should set isLoadingRequest to false after error', async () => {
      Sector.updateCountryHoliday.mockRejectedValue(new Error('Update failed'));

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      await wrapper.vm.handleSave();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoadingRequest).toBe(false);
    });

    it('should not emit events when update fails', async () => {
      Sector.updateCountryHoliday.mockRejectedValue(new Error('Update failed'));

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      await wrapper.vm.handleSave();

      expect(wrapper.emitted('update:enable-holidays')).toBeFalsy();
      expect(wrapper.emitted('update:disabled-holidays')).toBeFalsy();
      expect(wrapper.emitted('close')).toBeFalsy();
    });
  });

  describe('Modal Close', () => {
    it('should emit close event when modal is closed', async () => {
      wrapper = createWrapper();
      const closeButton = wrapper.find('[data-testid="modal-close"]');

      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Primary Button', () => {
    it('should show loading state when isLoadingRequest is true', async () => {
      wrapper = createWrapper({ isEditing: true });
      wrapper.vm.isLoadingRequest = true;
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty holidays array', () => {
      wrapper = createWrapper({
        holidays: [],
        enableHolidays: [],
      });

      expect(wrapper.vm.internalEnableHolidays).toEqual([]);
      const switches = wrapper.findAll('[data-testid="switch"]');
      expect(switches).toHaveLength(0);
    });

    it('should handle all holidays enabled', async () => {
      wrapper = createWrapper({
        holidays: defaultHolidays,
        enableHolidays: defaultHolidays.map((h) => h.date),
      });

      await wrapper.vm.handleSave();

      const enabledEvent = wrapper.emitted('update:enable-holidays')[0];
      expect(enabledEvent[0]).toHaveLength(3);
    });

    it('should handle all holidays disabled', async () => {
      wrapper = createWrapper({
        holidays: defaultHolidays,
        enableHolidays: [],
      });

      await wrapper.vm.handleSave();

      const disabledEvent = wrapper.emitted('update:disabled-holidays')[0];
      expect(disabledEvent[0]).toHaveLength(3);
    });
  });
});
