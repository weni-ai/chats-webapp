import { mount } from '@vue/test-utils';

import FormSector from '../Sector.vue';
import defaultProps from './mocks/sectorMock';

function createWrapper() {
  const wrapper = mount(FormSector, {
    props: defaultProps,
  });

  return wrapper;
}

describe('FormSector', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should render all section titles and tooltips', () => {
    const titles = wrapper.findAll('h2.title');
    const tooltips = wrapper.findAllComponents({ name: 'unnnic-tooltip' });

    expect(titles.at(0).text()).toMatch(
      /Add new sector Create a sector to manage the fulfillment operation, including roles, agents and management hours/gi,
    );
    expect(titles.at(1).text()).toMatch(
      /Service managers Add members to your project to be able to set as a manager/gi,
    );
    expect(titles.at(2).text()).toMatch(/Additional options/gi);
    expect(titles.at(3).text()).toMatch(/Definitions of the workday/gi);

    expect(titles.length).toBe(4);
    expect(tooltips.length).toBe(3);
  });

  it('should render all inputs', () => {
    const inputSector = wrapper
      .findAllComponents({ name: 'unnnic-input' })
      .at(0);
    expect(inputSector.exists()).toBe(true);
    expect(inputSector.props('label')).toMatch(/Sector name/gi);
    expect(inputSector.props('placeholder')).toMatch(/Example: Financial/gi);
    const selectManagerLabel = wrapper
      .findAllComponents({ name: 'unnnic-label' })
      .at(0);
    const selects = wrapper.findAllComponents({ name: 'unnnic-select-smart' });

    expect(selectManagerLabel.exists()).toBe(true);
    expect(selectManagerLabel.props('label')).toMatch(/Add manager/gi);
    expect(selects.length).toBe(1);

    const inputTrigger = wrapper.find('.unnnic-switch');
    const inputTriggerLabel = wrapper.find('.unnnic-switch__label');
    expect(inputTrigger.exists()).toBe(true);
    expect(inputTriggerLabel.text()).toMatch(
      /Triggering message templates disabled/gi,
    );

    const inputsTime = wrapper.findAll('input[type="time"]');
    expect(inputsTime.length).toBe(2);

    const inputLimitSimultaneousChats = wrapper
      .findAllComponents({ name: 'unnnic-input' })
      .at(-1);
    expect(inputLimitSimultaneousChats.exists()).toBe(true);
    expect(inputLimitSimultaneousChats.props('label')).toMatch(
      /Limit on the number of simultaneous calls per agent/gi,
    );
    expect(inputLimitSimultaneousChats.props('placeholder')).toMatch(/4/gi);
  });

  it('should have a managers list rendered', async () => {
    await wrapper.setProps({
      modelValue: {
        ...defaultProps.modelValue,
        managers: [
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
      },
    });

    const selectedMemberCards = wrapper.findAllComponents({
      name: 'selected-member',
    });
    expect(selectedMemberCards.length).toBe(2);
  });
});
