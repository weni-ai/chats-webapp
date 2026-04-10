import { mount, config } from '@vue/test-utils';

import FormAgent from '../Agent.vue';
import defaultProps from './mocks/agentMock';
import { expect, it } from 'vitest';

function createWrapper() {
  const wrapper = mount(FormAgent, {
    props: defaultProps,
    global: {
      components: {
        UnnnicToolTip: config.global.stubs.UnnnicToolTip,
      },
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
    const tooltips = wrapper.findAllComponents({ name: 'UnnnicToolTipStub' });

    expect(titles.at(0).text()).toContain('Add agents info');

    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const selects = wrapper.findAllComponents({ name: 'UnnnicSelect' });

    expect(selects.length).toBe(1);
    expect(selects.at(0).props('label')).toMatch(/Select agent/gi);
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

  it('should emit remove on remove method trigger', async () => {
    wrapper.vm.remove('1');
    expect(wrapper.emitted('remove')[0][0]).toBe('1');
  });
});
