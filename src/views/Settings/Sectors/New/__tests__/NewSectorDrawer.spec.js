import { flushPromises, mount, config } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import NewSectorDrawer from '../NewSectorDrawer.vue';

import Unnnic from '@weni/unnnic-system';
import General from '@/components/settings/forms/General.vue';
import ExtraOptions from '@/components/settings/forms/ExtraOptions.vue';
import FormQueue from '@/components/settings/forms/Queue.vue';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

import i18n from '@/plugins/i18n';

const managerMock = {
  uuid: '2',
  sector: '1',
  role: 1,
  user: {
    first_name: 'Test',
    last_name: 'Test',
    email: 'tests@weni.ai',
    status: '',
    photo_url: 'http://photo.link',
  },
};

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    create: vi.fn(),
    addAgent: vi.fn(),
    editQueue: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    create: vi.fn(),
    managers: vi.fn(() =>
      Promise.resolve({
        results: [managerMock],
      }),
    ),
    addManager: vi.fn(),
    update: vi.fn(),
    removeTag: vi.fn(),
    addTag: vi.fn(),
    getCountryHolidays: () =>
      Promise.resolve({ holidays: [], country_code: 'BR' }),
    setSectorWorkingDays: vi.fn(() => Promise.resolve()),
    createCountryHolidays: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    managers: () => ({ results: [managerMock] }),
    agents: () => ({ results: [managerMock] }),
  },
}));

describe('NewSectorDrawer', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(NewSectorDrawer, {
      props: { modelValue: true },
      global: {
        plugins: [
          i18n,
          createTestingPinia({
            initialState: {
              profile: { me: { email: 'tests@weni.ai' } },
              featureFlag: {
                featureFlags: {
                  active_features: ['weniChatsAutomaticMessage'],
                },
              },
            },
          }),
        ],
        components: {
          General,
          ExtraOptions,
          FormQueue,
          UnnnicDrawer: config.global.stubs.UnnnicDrawer,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('renders with the correct title and buttons based on activePageIndex', async () => {
    expect(wrapper.find('[data-testid="new-sector-drawer"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="primary-button"]').text()).toBe(
      wrapper.vm.$t('continue'),
    );
    expect(wrapper.find('[data-testid="secondary-button"]').text()).toBe(
      wrapper.vm.$t('cancel'),
    );

    await wrapper.setData({ activePageIndex: 3 });

    expect(wrapper.find('[data-testid="primary-button"]').text()).toBe(
      wrapper.vm.$t('save'),
    );
    expect(wrapper.find('[data-testid="secondary-button"]').text()).toBe(
      wrapper.vm.$t('back'),
    );
  });

  it('displays the correct page content based on activePageIndex', async () => {
    await wrapper.setData({ activePageIndex: 2 });
    expect(
      wrapper.findComponent('[data-testid="queue-form"]').isVisible(),
    ).toBe(true);
  });

  it('increases activePageIndex on primary button click if not last page', async () => {
    expect(wrapper.vm.activePageIndex).toBe(0);
    const generalForm = wrapper.findComponent('[data-testid="general-form"]');
    await generalForm.vm.$emit('change-is-valid', true);
    await wrapper.find('[data-testid="primary-button"]').trigger('click');
    expect(wrapper.vm.activePageIndex).toBe(1);
  });

  it('decreases activePageIndex on secondary button click if not first page', async () => {
    await wrapper.setData({ activePageIndex: 2 });

    await wrapper.find('[data-testid="secondary-button"]').trigger('click');
    expect(wrapper.vm.activePageIndex).toBe(1);
  });

  it('emit close event on secondary-button-click if activePageIndex = 0', async () => {
    await wrapper.find('[data-testid="secondary-button"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('displays DiscartChangesModal if there are unsaved changes and close button is clicked', async () => {
    await wrapper.setData({ showDiscartQuestion: true });

    await wrapper.vm.handleCloseNewSectorDrawer();
    expect(
      wrapper
        .findComponent('[data-testid="discart-changes-modal"]')
        .isVisible(),
    ).toBe(true);
  });

  it('emit close on confirm discart changes', async () => {
    await wrapper.setData({ showConfirmDiscartChangesModal: true });

    const discartModal = wrapper.findComponent(
      '[data-testid="discart-changes-modal"]',
    );

    discartModal.vm.$emit('primary-button-click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('preserve data on cancel discart', async () => {
    const dataMock = {
      showConfirmDiscartChangesModal: true,
      sector: {
        uuid: '',
        name: 'Sector Mock',
        can_trigger_flows: true,
        can_edit_custom_fields: true,
        sign_messages: true,
        automatic_message: {
          is_active: false,
          text: '',
        },
        managers: [],
        maxSimultaneousChatsByAgent: '4',
      },
    };
    await wrapper.setData(dataMock);

    const discartModal = wrapper.findComponent(
      '[data-testid="discart-changes-modal"]',
    );

    discartModal.vm.$emit('secondary-button-click');

    expect(wrapper.vm.showConfirmDiscartChangesModal).toBe(false);

    expect(wrapper.vm.$data.sector.name).toBe(dataMock.sector.name);
  });

  it('calls finish method on primary button click if last page', async () => {
    await wrapper.setData({ activePageIndex: 3 });

    const finishSpy = vi
      .spyOn(wrapper.vm, 'finish')
      .mockResolvedValueOnce(true);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');
    expect(finishSpy).toHaveBeenCalledOnce();
  });

  it('emits close event when close icon is clicked and no unsaved changes', async () => {
    await wrapper.vm.handleCloseNewSectorDrawer(true);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('call drawer close when parent emit event close', async () => {
    const closeSpy = vi.spyOn(wrapper.vm.$refs.newSectorDrawer, 'close');

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { event: 'close' },
      }),
    );

    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('should create a sector, add managers, create a queue, and show a success alert', async () => {
    const createdSectorMock = { uuid: 'sector-uuid', name: 'Test Sector' };
    const createdQueueMock = { uuid: 'queue-uuid' };

    vi.spyOn(Sector, 'create').mockResolvedValue(createdSectorMock);
    vi.spyOn(Queue, 'create').mockResolvedValue(createdQueueMock);
    vi.spyOn(Sector, 'addManager').mockResolvedValue(true);
    vi.spyOn(Queue, 'addAgent').mockResolvedValue(true);

    const unnnicAlertSpy = vi.spyOn(Unnnic, 'unnnicCallAlert');
    const finishSpy = vi.spyOn(wrapper.vm, 'finish');

    await wrapper.setData({
      sector: {
        name: 'Test Sector',
        managers: [managerMock],
        maxSimultaneousChatsByAgent: '5',
        automatic_message: {
          is_active: false,
          text: '',
        },
      },
      sectorQueue: {
        name: 'Test Queue',
        currentAgents: [managerMock],
      },
    });

    const generalForm = wrapper.findComponent('[data-testid="general-form"]');

    await generalForm.setData({
      selectedWorkdayDays: {
        monday: true,
      },
      selectedWorkdayDaysTime: {
        monday: [{ start: '08:00', end: '17:00', valid: true }],
      },
    });

    await wrapper.vm.$nextTick();

    const extraOptionsForm = wrapper.findComponent(ExtraOptions);

    const mockTag = { name: 'Tag Mock', uuid: '1' };

    await extraOptionsForm.setData({
      toAddTags: [mockTag],
      tags: [mockTag],
      currentTags: [mockTag],
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isValid.general).toBe(true);
    expect(wrapper.vm.isValid.extraOptions).toBe(true);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');

    expect(wrapper.vm.activePageIndex).toBe(1);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');

    expect(wrapper.vm.activePageIndex).toBe(2);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');

    expect(wrapper.vm.activePageIndex).toBe(3);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');

    expect(finishSpy).toHaveBeenCalled();

    await flushPromises();

    expect(unnnicAlertSpy).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('new_sector.alert.create_success', {
          sectorName: createdSectorMock.name,
        }),
        type: 'success',
      },
      seconds: 5,
    });
  });

  it('calls error alert on sector creation failure', async () => {
    const errorAlertSpy = vi.spyOn(Unnnic, 'unnnicCallAlert');

    vi.spyOn(Sector, 'create').mockRejectedValue(
      new Error('Error on create sector mock'),
    );

    try {
      await wrapper.vm.finish();
    } catch (error) {
      expect(errorAlertSpy).toHaveBeenCalledWith({
        props: {
          text: wrapper.vm.$t('new_sector.alert.create_error'),
          type: 'error',
        },
        seconds: 5,
      });
    }
  });
});
