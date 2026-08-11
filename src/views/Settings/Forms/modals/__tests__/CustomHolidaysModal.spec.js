import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import moment from 'moment';

import CustomHolidaysModal from '../CustomHolidaysModal.vue';
import Sector from '@/services/api/resources/settings/sector';
import unnnic from '@weni/unnnic-system';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    deleteSectorHoliday: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

const holidays = [
  {
    uuid: 'holiday-1',
    date: { start: '2026-01-01', end: '2026-01-01' },
    repeat: false,
  },
  {
    uuid: 'holiday-2',
    date: { start: '2026-12-24', end: '2026-12-25' },
    repeat: true,
  },
];

const createWrapper = (props = {}) => {
  return mount(CustomHolidaysModal, {
    props: {
      holidays,
      isEditing: false,
      sectorUuid: '',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicDialog: {
          name: 'UnnnicDialog',
          template: '<div data-testid="modal-dialog"><slot /></div>',
          props: ['open'],
        },
        UnnnicDialogContent: {
          name: 'UnnnicDialogContent',
          template: '<div><slot /></div>',
        },
        UnnnicDialogHeader: {
          name: 'UnnnicDialogHeader',
          template: '<div><slot /></div>',
        },
        UnnnicDialogTitle: {
          name: 'UnnnicDialogTitle',
          template: '<h1 data-testid="modal-title"><slot /></h1>',
        },
        UnnnicDialogFooter: {
          name: 'UnnnicDialogFooter',
          template: '<div data-testid="footer"><slot /></div>',
        },
        UnnnicDisclaimer: true,
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div><slot /></div>',
          props: ['enabled', 'side', 'text'],
        },
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template: '<button :data-icon="icon" @click="$emit(\'click\')" />',
          props: ['icon', 'clickable', 'scheme', 'size'],
        },
        UnnnicButton: {
          name: 'UnnnicButton',
          inheritAttrs: false,
          template:
            '<button :data-testid="$attrs[\'data-testid\']" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
          props: ['text', 'type', 'disabled', 'loading'],
        },
      },
    },
  });
};

describe('CustomHolidaysModal', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should render the modal with title', () => {
    wrapper = createWrapper();
    expect(wrapper.find('[data-testid="modal-dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="modal-title"]').text()).toBe(
      'custom_holidays.title',
    );
  });

  it('should format single-day holiday labels', () => {
    wrapper = createWrapper();
    const label = wrapper.vm.getDateFormattedLabel(holidays[0]);
    const expected = moment(holidays[0].date.start).format('L');
    expect(label).toBe(`${expected} `);
  });

  it('should format date-range holiday labels with repeat', () => {
    wrapper = createWrapper();
    const label = wrapper.vm.getDateFormattedLabel(holidays[1]);
    const start = moment(holidays[1].date.start).format('L');
    const end = moment(holidays[1].date.end).format('L');
    expect(label).toContain(`${start} to ${end}`);
    expect(label).toContain('sector.managers.working_day.repeat_annually');
  });

  it('should mark holiday for deletion and allow undo', async () => {
    wrapper = createWrapper();
    const deleteIcons = wrapper.findAll('[data-icon="delete"]');

    await deleteIcons[0].trigger('click');
    expect(wrapper.vm.toDeleteIds).toContain('holiday-1');

    const undoIcon = wrapper.find('[data-icon="undo"]');
    await undoIcon.trigger('click');
    expect(wrapper.vm.toDeleteIds).not.toContain('holiday-1');
  });

  it('should emit close when cancel is clicked', async () => {
    wrapper = createWrapper();
    await wrapper.find('[data-testid="modal-close"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should filter deleted holidays locally when not editing', async () => {
    wrapper = createWrapper({ isEditing: false });
    wrapper.vm.toDeleteIds = ['holiday-1'];

    await wrapper.vm.save();
    await flushPromises();

    expect(Sector.deleteSectorHoliday).not.toHaveBeenCalled();
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0].holidays).toEqual([holidays[1]]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should delete holidays via API when editing and succeed', async () => {
    Sector.deleteSectorHoliday.mockResolvedValue({});
    wrapper = createWrapper({
      isEditing: true,
      sectorUuid: 'sector-1',
    });
    wrapper.vm.toDeleteIds = ['holiday-1'];

    await wrapper.vm.save();
    await flushPromises();

    expect(Sector.deleteSectorHoliday).toHaveBeenCalledWith(
      'sector-1',
      'holiday-1',
    );
    expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          text: 'custom_holidays.message.save.success',
          type: 'success',
        }),
      }),
    );
    expect(wrapper.emitted('save')[0][0].holidays).toEqual([holidays[1]]);
  });

  it('should show error alert when delete fails while editing', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Sector.deleteSectorHoliday.mockRejectedValue(new Error('fail'));
    wrapper = createWrapper({
      isEditing: true,
      sectorUuid: 'sector-1',
    });
    wrapper.vm.toDeleteIds = ['holiday-1'];

    await wrapper.vm.save();
    await flushPromises();

    expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          text: 'custom_holidays.message.save.error',
          type: 'error',
        }),
      }),
    );
    // failed delete keeps holiday in the emitted list
    expect(wrapper.emitted('save')[0][0].holidays).toEqual(holidays);
    consoleSpy.mockRestore();
  });
});
