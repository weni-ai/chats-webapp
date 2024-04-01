import { mount, createLocalVue } from '@vue/test-utils';
import { unnnicToolTip, unnnicButton } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import FormTags from '../Tags';
import defaultProps from './mocks/tagsMock';

const localVue = createLocalVue();

function createWrapper() {
  const wrapper = mount(FormTags, {
    propsData: defaultProps,
    stubs: {
      UnnnicToolTip: true,
      UnnnicButton: unnnicButton,
    },
    localVue,
    i18n,
  });

  return wrapper;
}

describe('FormTags', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should render all section titles and tooltips', () => {
    const titles = wrapper.findAll('.form-tags__section__label');
    const tooltips = wrapper.findAllComponents(unnnicToolTip);

    expect(titles.at(0).text()).toMatch(/Adicionar tags/gi);

    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const inputTag = wrapper.findAllComponents({ name: 'unnnic-input' }).at(0);
    expect(inputTag.exists()).toBe(true);
    expect(inputTag.props('label')).toMatch(/Nome da tag/gi);
    expect(inputTag.props('placeholder')).toMatch(/Exemplo: Dúvidas/gi);
  });

  it('should render a tag list when added by user and clear input', async () => {
    const inputTag = wrapper.find('input');
    const buttonAddTag = wrapper.findComponent(unnnicButton);

    await inputTag.setValue('Tag1');
    expect(wrapper.vm.$data.tag).toBe('Tag1');

    await buttonAddTag.trigger('click');
    expect(inputTag.element.value).toBe('');

    // TODO: Check if the tag group exists
  });

  it('should have a tags list rendered', async () => {
    await wrapper.setProps({
      value: [
        { uuid: '1685448788527', name: 'Tag1' },
        { uuid: '1685449403735', name: 'Tag2' },
      ],
    });

    const titles = wrapper.findAll('.form-tags__section__label');
    expect(titles.at(1).text()).toMatch(/Tags adicionadas/gi);
    expect(titles.length).toBe(2);

    const tagGroupSection = wrapper.find('.tag-group__tags');
    expect(tagGroupSection.exists()).toBe(true);
  });
});
