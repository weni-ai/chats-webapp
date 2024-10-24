import { mount } from '@vue/test-utils';
import UnnnicSystem from '@/plugins/UnnnicSystem';
import i18n from '@/plugins/i18n';

import FormQueue from '../Queue.vue';
import defaultProps from './mocks/queueMock';

function createWrapper() {
  const wrapper = mount(FormQueue, {
    props: defaultProps,
    global: {
      plugins: [i18n, UnnnicSystem],
    },
  });

  return wrapper;
}

describe('FormQueue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should render all section titles and tooltips', () => {
    const titles = wrapper.findAll('.title');
    const tooltips = wrapper.findAllComponents({ name: 'unnnic-tooltip' });

    expect(titles.at(0).text()).toMatch(/Create new queue/gi);
    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const inputQueue = wrapper
      .findAllComponents({ name: 'unnnic-input' })
      .at(0);
    expect(inputQueue.exists()).toBe(true);
    expect(inputQueue.props('label')).toMatch(/Queue name/gi);
    expect(inputQueue.props('placeholder')).toMatch(/Example: Payments/gi);
  });
});
