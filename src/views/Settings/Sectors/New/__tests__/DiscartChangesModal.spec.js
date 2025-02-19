import { beforeEach, describe } from 'vitest';
import { mount } from '@vue/test-utils';

import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

const createWrapper = () => {
  return mount(DiscartChangesModal, {
    props: { showModal: true, title: 'Title', text: 'Text' },
  });
};

describe('DiscartChangesModal.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should display the modal title', async () => {
    const title = wrapper.find('[data-testid="discart-changes-modal"]');
    expect(title.text()).toContain('Title');
  });
  it('should display the modal hint', () => {
    const title = wrapper.find('[data-testid="discart-changes-modal"]');
    expect(title.text()).toContain('Text');
  });
  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
