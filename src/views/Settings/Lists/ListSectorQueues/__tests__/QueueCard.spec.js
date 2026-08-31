import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import QueueCard from '../QueueCard.vue';
import i18n from '@/plugins/i18n';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const queueMock = {
  uuid: 'queue-uuid-1',
  name: 'Support Queue',
  default_message: 'Hello',
  queue_limit: { is_active: false, limit: null },
};

const createWrapper = (props = {}) => {
  return mount(QueueCard, {
    attachTo: document.body,
    props: {
      queue: queueMock,
      ...props,
    },
  });
};

describe('QueueCard.vue', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should render the queue name', () => {
    expect(wrapper.find('[data-testid="queue-card-title"]').text()).toBe(
      queueMock.name,
    );
  });

  it('should emit edit when the card is clicked', async () => {
    await wrapper.find('[data-testid="queue-card"]').trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0][0]).toEqual(queueMock);
  });

  it('should emit edit when edit option is clicked', async () => {
    wrapper.vm.openPopover = true;
    await wrapper.vm.$nextTick();
    await flushPromises();

    await wrapper.find('[data-testid="queue-card-edit-option"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0][0]).toEqual(queueMock);
    expect(wrapper.vm.openPopover).toBe(false);
  });

  it('should emit delete when delete option is clicked', async () => {
    wrapper.vm.openPopover = true;
    await wrapper.vm.$nextTick();
    await flushPromises();

    await wrapper
      .find('[data-testid="queue-card-delete-option"]')
      .trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')[0][0]).toEqual(queueMock);
    expect(wrapper.vm.openPopover).toBe(false);
  });

  it('should not emit edit when actions area is clicked', async () => {
    await wrapper.find('[data-testid="queue-card-actions"]').trigger('click');

    expect(wrapper.emitted('edit')).toBeFalsy();
  });

  it('should render edit and delete option labels', async () => {
    wrapper.vm.openPopover = true;
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="queue-card-edit-option"]').text(),
    ).toContain(i18n.global.t('edit'));
    expect(
      wrapper.find('[data-testid="queue-card-delete-option"]').text(),
    ).toContain(i18n.global.t('delete'));
  });
});
