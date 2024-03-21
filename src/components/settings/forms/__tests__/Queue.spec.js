import { mount, createLocalVue } from '@vue/test-utils';
import { unnnicToolTip } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import FormQueue from '../Queue';
import defaultProps from './mocks/queueMock';

const localVue = createLocalVue();

function createWrapper() {
  const wrapper = mount(FormQueue, {
    propsData: defaultProps,
    stubs: {
      unnnicToolTip,
    },
    localVue,
    i18n,
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
    const tooltips = wrapper.findAll('.unnnic-tooltip');

    expect(titles.at(0).text()).toMatch(/Adicionar nova Fila/gi);

    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const inputQueue = wrapper
      .findAllComponents({ name: 'unnnic-input' })
      .at(0);
    expect(inputQueue.exists()).toBe(true);
    expect(inputQueue.props('label')).toMatch(/Nome da fila/gi);
    expect(inputQueue.props('placeholder')).toMatch(/Exemplo: Pagamentos/gi);
  });
});
