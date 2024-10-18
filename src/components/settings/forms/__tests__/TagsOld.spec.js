import { mount } from '@vue/test-utils';
import FormTags from '../TagsOld.vue';
import defaultProps from './mocks/tagsMock';

function createWrapper() {
  const wrapper = mount(FormTags, {
    props: defaultProps,
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
    const tooltips = wrapper.findAllComponents('.unnnic-tooltip');

    expect(titles.at(0).text()).toMatch(
      /Add tags Tags are used to classify service characteristics and make it possible to search and filter chats from them, define tags that are relevant to your context/gi,
    );

    expect(titles.length).toBe(1);
    expect(tooltips.length).toBe(1);
  });

  it('should render all inputs', () => {
    const inputTag = wrapper.findAllComponents({ name: 'unnnic-input' }).at(0);
    expect(inputTag.exists()).toBe(true);
    expect(inputTag.props('label')).toMatch(/Tag name/gi);
    expect(inputTag.props('placeholder')).toMatch(/Example: Doubts/gi);
  });

  it('should render a tag list when added by user and clear input', async () => {
    const inputTag = wrapper.find('input');
    const buttonAddTag = wrapper.find('.unnnic-button');

    await inputTag.setValue('Tag1');
    expect(wrapper.vm.$data.tag).toBe('Tag1');

    await buttonAddTag.trigger('click');
    expect(inputTag.element.value).toBe('');

    // TODO: Check if the tag group exists
  });

  it('should have a tags list rendered', async () => {
    await wrapper.setProps({
      modelValue: [
        { uuid: '1685448788527', name: 'Tag1' },
        { uuid: '1685449403735', name: 'Tag2' },
      ],
    });

    const titles = wrapper.findAll('.form-tags__section__label');
    expect(titles.at(1).text()).toMatch(/Added Tags/gi);
    expect(titles.length).toBe(2);

    const tagGroupSection = wrapper.find('.tag-group__tags');
    expect(tagGroupSection.exists()).toBe(true);
  });
});
