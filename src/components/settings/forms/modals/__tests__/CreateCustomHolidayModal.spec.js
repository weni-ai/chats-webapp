import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateCustomHolidayModal from '../CreateCustomHolidayModal.vue';
import Sector from '@/services/api/resources/settings/sector';
import unnnic from '@weni/unnnic-system';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    createSectorHoliday: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

describe('CreateCustomHolidayModal', () => {
  let wrapper;

  const createWrapper = (props = {}) => {
    return mount(CreateCustomHolidayModal, {
      props: {
        isEditing: false,
        sectorUuid: '',
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
            props: ['modelValue', 'title', 'primaryButtonProps'],
            emits: ['update:model-value', 'primary-button-click'],
          },
          UnnnicInputDatePicker: {
            template: `
              <div data-testid="date-picker">
                <input 
                  data-testid="date-input"
                  :value="JSON.stringify(modelValue)"
                  @input="$emit('update:modelValue', JSON.parse($event.target.value))"
                />
              </div>
            `,
            props: [
              'modelValue',
              'options',
              'next',
              'fillW',
              'actionText',
              'disableClear',
            ],
            emits: ['update:modelValue'],
          },
          UnnnicSwitch: {
            template: `
              <div data-testid="switch" @click="handleClick">
                <span data-testid="switch-text">{{ textRight }}</span>
                <span data-testid="switch-value">{{ modelValue ? 'on' : 'off' }}</span>
              </div>
            `,
            props: ['modelValue', 'textRight', 'size'],
            emits: ['update:model-value'],
            methods: {
              handleClick() {
                this.$emit('update:model-value', !this.modelValue);
              },
            },
          },
          UnnnicButton: {
            template: `
              <button 
                data-testid="add-button"
                @click="$emit('click')"
              >
                {{ text }}
              </button>
            `,
            props: ['iconCenter', 'type', 'text', 'class'],
            emits: ['click'],
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

    it('should display the modal title', () => {
      wrapper = createWrapper();
      const title = wrapper.find('[data-testid="modal-title"]');
      expect(title.text()).toBe('Add Specific Non-working Dates');
    });

    it('should render initial form with empty date and repeat false', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.forms).toHaveLength(1);
      expect(wrapper.vm.forms[0]).toEqual({
        date: { start: '', end: '' },
        repeat: false,
      });
    });

    it('should render date picker for each form', () => {
      wrapper = createWrapper();
      const datePickers = wrapper.findAll(
        '[data-testid="create-custom-holiday-form"]',
      );
      expect(datePickers).toHaveLength(1);
    });

    it('should render switch for repeat annually', () => {
      wrapper = createWrapper();
      const switches = wrapper.findAll('[data-testid="switch"]');
      expect(switches).toHaveLength(1);
      expect(switches[0].find('[data-testid="switch-text"]').text()).toBe(
        'Repeat annually',
      );
    });

    it('should render add button', () => {
      wrapper = createWrapper();
      const addButton = wrapper.find('[data-testid="add-button"]');
      expect(addButton.exists()).toBe(true);
    });
  });

  describe('Add Form', () => {
    it('should add a new form when add button is clicked', async () => {
      wrapper = createWrapper();
      const addButton = wrapper.find('[data-testid="add-button"]');

      expect(wrapper.vm.forms).toHaveLength(1);

      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.forms).toHaveLength(2);
      expect(wrapper.vm.forms[1]).toEqual({
        date: { start: '', end: '' },
        repeat: false,
      });
    });

    it('should render multiple forms when added', async () => {
      wrapper = createWrapper();
      const addButton = wrapper.find('[data-testid="add-button"]');

      await addButton.trigger('click');
      await addButton.trigger('click');
      await wrapper.vm.$nextTick();

      console.log(wrapper.html());

      const datePickers = wrapper.findAll(
        '[data-testid="create-custom-holiday-form"]',
      );
      expect(datePickers).toHaveLength(3);
    });
  });

  describe('Form Interaction', () => {
    it('should toggle repeat when switch is clicked', async () => {
      wrapper = createWrapper();
      const switchComponent = wrapper.find('[data-testid="switch"]');

      expect(wrapper.vm.forms[0].repeat).toBe(false);

      await switchComponent.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.forms[0].repeat).toBe(true);
    });
  });

  describe('Save - Not Editing Mode', () => {
    it('should emit add-custom-holidays event with forms', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.save();

      expect(wrapper.emitted('add-custom-holidays')).toBeTruthy();
      expect(wrapper.emitted('add-custom-holidays')[0][0]).toEqual([
        { date: { start: '', end: '' }, repeat: false },
      ]);
    });

    it('should emit close event after save', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.save();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should not call Sector.createSectorHoliday when not editing', async () => {
      wrapper = createWrapper({ isEditing: false });
      await wrapper.vm.save();

      expect(Sector.createSectorHoliday).not.toHaveBeenCalled();
    });
  });

  describe('Save - Editing Mode (Success)', () => {
    it('should call Sector.createSectorHoliday for each form with start date', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms = [
        {
          date: { start: '2024-01-01', end: '2024-01-01' },
          repeat: false,
        },
        {
          date: { start: '2024-12-25', end: '2024-12-25' },
          repeat: true,
        },
        {
          date: { start: '', end: '' },
          repeat: false,
        },
      ];

      await wrapper.vm.save();

      expect(Sector.createSectorHoliday).toHaveBeenCalledTimes(2);
      expect(Sector.createSectorHoliday).toHaveBeenCalledWith('sector-123', {
        date: { start: '2024-01-01', end: '2024-01-01' },
        repeat: false,
        success: true,
        uuid: 'holiday-123',
      });
    });

    it('should filter out forms without start date', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms = [
        {
          date: { start: '2024-01-01', end: '2024-01-01' },
          repeat: false,
        },
        {
          date: { start: '', end: '' },
          repeat: false,
        },
      ];

      await wrapper.vm.save();

      expect(Sector.createSectorHoliday).toHaveBeenCalledTimes(1);
    });

    it('should assign uuid and success to forms after successful creation', async () => {
      Sector.createSectorHoliday
        .mockResolvedValueOnce({ uuid: 'holiday-1' })
        .mockResolvedValueOnce({ uuid: 'holiday-2' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms = [
        {
          date: { start: '2024-01-01', end: '2024-01-01' },
          repeat: false,
        },
        {
          date: { start: '2024-12-25', end: '2024-12-25' },
          repeat: true,
        },
      ];

      await wrapper.vm.save();

      expect(wrapper.vm.forms[0].uuid).toBe('holiday-1');
      expect(wrapper.vm.forms[0].success).toBe(true);
      expect(wrapper.vm.forms[1].uuid).toBe('holiday-2');
      expect(wrapper.vm.forms[1].success).toBe(true);
    });

    it('should show success alert after successful creation', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Non-working dates added successfully.',
          type: 'success',
        },
      });
    });

    it('should filter out unsuccessful forms after save', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms = [
        {
          date: { start: '2024-01-01', end: '2024-01-01' },
          repeat: false,
        },
        {
          date: { start: '', end: '' },
          repeat: false,
        },
      ];

      await wrapper.vm.save();

      expect(wrapper.vm.forms).toHaveLength(1);
      expect(wrapper.vm.forms[0].success).toBe(true);
    });

    it('should set isLoading to true during save', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      Sector.createSectorHoliday.mockReturnValue(promise);

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      const savePromise = wrapper.vm.save();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoading).toBe(true);

      resolvePromise();
      await savePromise;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should emit add-custom-holidays with successful forms', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();

      const emittedForms = wrapper.emitted('add-custom-holidays')[0][0];
      expect(emittedForms).toHaveLength(1);
      expect(emittedForms[0].uuid).toBe('holiday-123');
      expect(emittedForms[0].success).toBe(true);
    });

    it('should emit close event after successful save', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Save - Editing Mode (Error)', () => {
    it('should show error alert when creation fails', async () => {
      const error = new Error('Creation failed');
      Sector.createSectorHoliday.mockRejectedValue(error);

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: 'Failed to add some non-working dates, please check and try again.',
          type: 'error',
        },
      });
    });

    it('should set isLoading to false after error', async () => {
      Sector.createSectorHoliday.mockRejectedValue(
        new Error('Creation failed'),
      );

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should filter out unsuccessful forms after error', async () => {
      Sector.createSectorHoliday.mockRejectedValue(
        new Error('Creation failed'),
      );

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();

      expect(wrapper.vm.forms).toHaveLength(0);
    });

    it('should still emit add-custom-holidays and close after error', async () => {
      Sector.createSectorHoliday.mockRejectedValue(
        new Error('Creation failed'),
      );

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = { start: '2024-01-01', end: '2024-01-01' };

      await wrapper.vm.save();

      expect(wrapper.emitted('add-custom-holidays')).toBeTruthy();
      expect(wrapper.emitted('close')).toBeTruthy();
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
    it('should show loading state when isLoading is true', async () => {
      wrapper = createWrapper({ isEditing: true });
      wrapper.vm.isLoading = true;
      await wrapper.vm.$nextTick();

      const primaryButton = wrapper.find('[data-testid="primary-button"]');
      expect(primaryButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple forms with mixed valid and invalid dates', async () => {
      Sector.createSectorHoliday
        .mockResolvedValueOnce({ uuid: 'holiday-1' })
        .mockResolvedValueOnce({ uuid: 'holiday-2' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms = [
        {
          date: { start: '2024-01-01', end: '2024-01-01' },
          repeat: false,
        },
        {
          date: { start: '', end: '' },
          repeat: false,
        },
        {
          date: { start: '2024-12-25', end: '2024-12-25' },
          repeat: true,
        },
        {
          date: { start: '', end: '2024-06-01' },
          repeat: false,
        },
      ];

      await wrapper.vm.save();

      expect(Sector.createSectorHoliday).toHaveBeenCalledTimes(2);
      expect(wrapper.vm.forms).toHaveLength(2);
    });

    it('should handle all forms without start date', async () => {
      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms = [
        {
          date: { start: '', end: '' },
          repeat: false,
        },
        {
          date: { start: '', end: '' },
          repeat: true,
        },
      ];

      await wrapper.vm.save();

      expect(Sector.createSectorHoliday).not.toHaveBeenCalled();
      expect(wrapper.vm.forms).toHaveLength(0);
    });

    it('should handle date range (start and end different)', async () => {
      Sector.createSectorHoliday.mockResolvedValue({ uuid: 'holiday-123' });

      wrapper = createWrapper({
        isEditing: true,
        sectorUuid: 'sector-123',
      });

      wrapper.vm.forms[0].date = {
        start: '2024-01-01',
        end: '2024-01-05',
      };

      await wrapper.vm.save();

      expect(Sector.createSectorHoliday).toHaveBeenCalledWith('sector-123', {
        date: { start: '2024-01-01', end: '2024-01-05' },
        repeat: false,
        success: true,
        uuid: 'holiday-123',
      });
    });
  });
});
