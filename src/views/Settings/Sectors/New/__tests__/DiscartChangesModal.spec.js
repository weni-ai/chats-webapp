import { mount } from '@vue/test-utils';

import DiscartChangesModal from '../DiscartChangesModal.vue';
import { beforeEach, describe } from 'vitest';

const createWrapper = () => {
  return mount(DiscartChangesModal, { props: { showModal: true } });
};

describe('DiscartChangesModal.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should display the modal title', () => {
    const title = wrapper.find('[data-testid="discart-changes-modal"]');
    expect(title.text()).toContain(wrapper.vm.$t('new_sector.discart.title'));
  });
  it('should display the modal hint', () => {
    const title = wrapper.find('[data-testid="discart-changes-modal"]');
    expect(title.text()).toContain(wrapper.vm.$t('new_sector.discart.hint'));
  });
  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
