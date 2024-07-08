import { mount } from '@vue/test-utils';
import UnnnicSystem from '@/plugins/UnnnicSystem';
import i18n from '@/plugins/i18n';

import FormAgent from '../Agent.vue';
import defaultProps from './mocks/agentMock';

function createWrapper() {
  const wrapper = mount(FormAgent, {
    props: defaultProps,
    global: {
      plugins: [i18n, UnnnicSystem],
    },
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
    const tooltips = wrapper.findAllComponents({ name: 'unnnic-tooltip' });

    expect(titles.at(0).text()).toMatch(/Adicionar agentes/gi);

    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const inputAgentsLabel = wrapper
      .findAllComponents({ name: 'unnnic-label' })
      .at(0);
    const selects = wrapper.findAllComponents({ name: 'unnnic-select-smart' });

    expect(inputAgentsLabel.exists()).toBe(true);
    expect(inputAgentsLabel.props('label')).toMatch(/Selecionar agente/gi);
    expect(selects.length).toBe(1);
  });

  it('should have a agents list rendered', async () => {
    await wrapper.setProps({
      modelValue: [
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
