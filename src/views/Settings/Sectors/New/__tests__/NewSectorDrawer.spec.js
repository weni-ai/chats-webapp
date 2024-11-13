import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import NewSectorDrawer from '../NewSectorDrawer.vue';

import Unnnic from '@weni/unnnic-system';
import General from '@/components/settings/forms/General.vue';
import ExtraOptions from '@/components/settings/forms/ExtraOptions.vue';
import Queue from '@/components/settings/forms/Queue.vue';

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    create: vi.fn(),
    addAgent: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    addManager: vi.fn(),
  },
}));

describe('NewSectorDrawer', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(NewSectorDrawer, {
      props: { modelValue: true },
      global: {
        stubs: {
          DiscartChangesModal: true,
        },
        components: {
          General,
          ExtraOptions,
          Queue,
        },
      },
    });
  });

  it('renders with the correct title and buttons based on activePageIndex', () => {
    expect(wrapper.find('[data-testid="new-sector-drawer"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="primary-button"]').text()).toBe(
      wrapper.vm.$t('continue'),
    );
    expect(wrapper.find('[data-testid="secondary-button"]').text()).toBe(
      wrapper.vm.$t('cancel'),
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

  it('displays DiscartChangesModal if there are unsaved changes and close button is clicked', async () => {
    await wrapper.setData({ showDiscartQuestion: true });

    await wrapper.vm.handleCloseNewSectorDrawer();
    expect(
      wrapper
        .findComponent('[data-testid="discart-changes-modal"]')
        .isVisible(),
    ).toBe(true);
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

  //   it('shows success message on successful sector creation', async () => {
  //     const unnnicAlertSpy = vi.spyOn(Unnnic, 'unnnicCallAlert');

  //     await wrapper.vm.finish();

  //     expect(unnnicAlertSpy).toHaveBeenCalledWith({
  //       props: {
  //         text: wrapper.vm.$t('new_sector.alert.create_success', {
  //           sectorName: '',
  //         }),
  //         type: 'success',
  //       },
  //       seconds: 5,
  //     });
  //   });
});
