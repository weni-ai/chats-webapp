import { mount, createLocalVue } from '@vue/test-utils';
import {
  unnnicToolTip,
  unnnicLabel,
  unnnicSelectSmart,
} from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import FormAgent from '../Agent';
import defaultProps from './mocks/agentMock';

const localVue = createLocalVue();

function createWrapper() {
  const wrapper = mount(FormAgent, {
    propsData: defaultProps,
    stubs: {
      UnnnicToolTip: true,
      UnnnicLabel: true,
      UnnnicSelectSmart: true,
    },
    localVue,
    i18n,
  });

  return wrapper;
}

describe('FormAgent', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should render all section titles and tooltips', () => {
    const titles = wrapper.findAll('.title');
    const tooltips = wrapper.findAllComponents(unnnicToolTip);

    expect(titles.at(0).text()).toMatch(/Adicionar agentes/gi);

    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const inputAgentsLabel = wrapper.findAllComponents(unnnicLabel).at(0);
    const selects = wrapper.findAllComponents(unnnicSelectSmart);

    expect(inputAgentsLabel.exists()).toBe(true);
    expect(inputAgentsLabel.props('label')).toMatch(/Selecionar agente/gi);
    expect(selects.length).toBe(1);
  });

  it('should have a agents list rendered', async () => {
    await wrapper.setProps({
      value: [
        {
          user: {
            email: 'maria.silva@weni.ai',
            first_name: 'Maria',
            last_name: 'Silva',
            photo_url: null,
          },
        },
        {
          user: {
            email: 'joao.souza@weni.ai',
            first_name: 'João',
            last_name: 'Souza',
            photo_url: null,
          },
        },
      ],
    });

    const selectedMemberCards = wrapper.findAllComponents({
      name: 'selected-member',
    });
    expect(selectedMemberCards.length).toBe(2);
  });
});
