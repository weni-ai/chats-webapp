import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import NewSectorDrawer from '../NewSectorDrawer.vue';

import Unnnic from '@weni/unnnic-system';
import General from '@/components/settings/forms/General.vue';
import ExtraOptions from '@/components/settings/forms/ExtraOptions.vue';
import FormQueue from '@/components/settings/forms/Queue.vue';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

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
          createTestingPinia({
            initialState: { profile: { me: { email: 'tests@weni.ai' } } },
          }),
        ],
        stubs: {
          DiscartChangesModal: true,
        },
        components: {
          General,
          ExtraOptions,
          FormQueue,
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

  it('close drawer on secondary-button-click if activePageIndex = 0', async () => {
    const closeSpy = vi.spyOn(wrapper.vm.$refs.newSectorDrawer, 'close');
    await wrapper.find('[data-testid="secondary-button"]').trigger('click');

    expect(closeSpy).toHaveBeenCalledOnce();
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
    await wrapper.setData({ showDiscartQuestion: true });

    const discartModal = wrapper.findComponent(
      '[data-testid="discart-changes-modal"]',
    );

    discartModal.vm.$emit('primary-button-click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('preserve data on cancel discart', async () => {
    await wrapper.setData({
      showDiscartQuestion: true,
      sector: {
        uuid: '',
        name: 'Sector Mock',
        can_trigger_flows: true,
        can_edit_custom_fields: true,
        sign_messages: true,
        workingDay: {
          start: '',
          end: '',
          dayOfWeek: 'week-days',
        },
        managers: [],
        maxSimultaneousChatsByAgent: '4',
      },
    });

    const discartModal = wrapper.findComponent(
      '[data-testid="discart-changes-modal"]',
    );

    discartModal.vm.$emit('secondary-button-click');

    expect(wrapper.vm.showConfirmDiscartChangesModal).toBe(false);
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
        workingDay: { start: '08:00', end: '17:00' },
        managers: [managerMock],
        maxSimultaneousChatsByAgent: '5',
      },
      sectorQueue: {
        name: 'Test Queue',
        currentAgents: [managerMock],
      },
    });

    const extraOptionsForm = wrapper.findComponent(
      '[data-testid="extra-options-form"]',
    );

    const mockTag = { name: 'Tag Mock', uuid: '1' };

    await extraOptionsForm.setData({
      toAddTags: [mockTag],
      tags: [mockTag],
      currentTags: [mockTag],
    });

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
