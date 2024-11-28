import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import { createMemoryHistory, createRouter } from 'vue-router';

import FormSectorExtraOptions from '../ExtraOptions.vue';

import unnnic from '@weni/unnnic-system';

const defaultTags = [
  { uuid: 'finance', name: 'Financeiro' },
  { uuid: 'doubts', name: 'Dúvidas' },
  { uuid: 'help', name: 'Ajuda' },
];

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    tags: () => Promise.resolve({ results: defaultTags }),
    update: () => Promise.resolve(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
  },
}));

const sectorExtraOptionsMock = {
  uuid: '1',
  can_trigger_flows: false,
  sign_messages: false,
  can_edit_custom_fields: false,
};

const routes = [{ path: '/settings', name: 'settings' }];
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.push = vi.fn();

function createWrapper(props = {}) {
  const wrapper = mount(FormSectorExtraOptions, {
    props: { modelValue: sectorExtraOptionsMock, isEditing: false, ...props },
    global: {
      plugins: [router],
      stubs: {
        UnnnicSwitch: true,
      },
    },
  });

  return wrapper;
}

describe('SectorExtraOptions', () => {
  let wrapper;

  beforeEach(async () => {
    wrapper = createWrapper();
    await flushPromises();
  });

  it('should render switches and switches title', async () => {
    await wrapper.setProps({ isEditing: true });
    const switchesTitle = wrapper.find('[data-testid="switchs-title"]');
    expect(switchesTitle.text()).toBe(
      wrapper.vm.$t('sector.additional_options.title'),
    );

    const switchs = wrapper.findAllComponents('[data-testid="config-switch"]');

    expect(switchs.length).toBe(3);

    expect(switchs[0].props().textRight).toContain(
      wrapper.vm.translationTriggerFlows,
    );

    expect(switchs[1].props().textRight).toContain(
      wrapper.vm.translationSignMessages,
    );

    expect(switchs[2].props().textRight).toContain(
      wrapper.vm.$t('sector.additional_options.edit_custom_fields'),
    );

    const actions = wrapper.find(
      '[data-testid="sector-extra-options-actions"]',
    );
    expect(actions.exists()).toBe(true);
  });

  it('should render tags section (without tags)', () => {
    const tagsTitle = wrapper.find('[data-testid="tags-title"]');
    expect(tagsTitle.exists()).toBe(true);
    const tagsInput = wrapper.find('[data-testid="tags-input-tag-name"]');
    expect(tagsInput.exists()).toBe(true);
    const tagsAddButton = wrapper.find('[data-testid="tags-add-tag-button"]');
    expect(tagsAddButton.exists()).toBe(true);
    const tagsSection = wrapper.find('[data-testid="tags-group-section"]');
    expect(tagsSection.exists()).toBe(false);
  });

  it('should reder tags seciton (with tags)', async () => {
    await wrapper.setData({ tags: defaultTags });

    const tagsSection = wrapper.find('[data-testid="tags-group-section"]');
    expect(tagsSection.exists()).toBe(true);
  });

  it('should emit update:modeValue on change sector', () => {
    wrapper.vm.sector = { ...sectorExtraOptionsMock };
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
  });

  it('should get sector tags on mounted if isEditing is true', async () => {
    const getTagsSpy = vi.spyOn(FormSectorExtraOptions.methods, 'getTags');

    const wrapper = createWrapper({ isEditing: true });
    await flushPromises();
    expect(getTagsSpy).toHaveBeenCalled();
    await flushPromises();
    expect(wrapper.vm.currentTags).toEqual(defaultTags);
    expect(wrapper.vm.tags).toEqual(defaultTags);

    await getTagsSpy.mockReset();
  });

  it('should add tag on click add tag button', async () => {
    const addTagSpy = vi.spyOn(wrapper.vm, 'addTag');
    await wrapper.setData({ tagName: 'Tag 1' });
    const addTagButton = wrapper.find('[data-testid="tags-add-tag-button"]');
    await addTagButton.trigger('click');
    expect(addTagSpy).toHaveBeenCalledWith('Tag 1');
    expect(wrapper.vm.toAddTags[0].name).toEqual('Tag 1');
    expect(wrapper.vm.tags[0].name).toEqual('Tag 1');
    addTagSpy.mockClear();
  });

  it('should prevent add duplicated tag if alredy exists', async () => {
    const unnnicAlertSpy = vi.spyOn(unnnic, 'unnnicCallAlert');
    await wrapper.setData({ tags: defaultTags });

    wrapper.vm.addTag('Financeiro');
    expect(unnnicAlertSpy).toBeCalledWith({
      props: {
        text: wrapper.vm.$t('config_chats.edit_sector.tag_already_exists'),
        type: 'error',
      },
    });
  });

  it('should remove tag from tags and add to toRemoveTags', async () => {
    const removeTagSpy = vi.spyOn(wrapper.vm, 'removeTag');

    await wrapper.setData({ tags: defaultTags, toAddTags: defaultTags });
    const tagGroup = wrapper.findComponent('[data-testid="sector-tag-group"]');
    tagGroup.vm.close(defaultTags[0]);
    expect(removeTagSpy).toHaveBeenCalledWith(defaultTags[0]);
    expect(wrapper.vm.toRemoveTags[0].name).toBe('Financeiro');

    const toAddTagsNames = wrapper.vm.toAddTags.map((tag) => tag.name);
    const tagssNames = wrapper.vm.tags.map((tag) => tag.name);

    expect(toAddTagsNames.includes('Financeiro')).toBe(false);
    expect(tagssNames.includes('Financeiro')).toBe(false);
  });

  it('should save configs on click save button if isEditing is true', async () => {
    const saveSpy = vi.spyOn(wrapper.vm, 'save');
    const updateSectorTagsSpy = vi.spyOn(wrapper.vm, 'updateSectorTags');
    const updateSectorExtraConfigsSpy = vi.spyOn(
      wrapper.vm,
      'updateSectorExtraConfigs',
    );

    await wrapper.setProps({
      sector: { ...wrapper.vm.sector, can_trigger_flows: true },
      isEditing: true,
    });

    await wrapper.setData({
      currentTags: [{ uuid: 'remove', name: 'remove' }],
      toAddTags: defaultTags,
      tags: [...defaultTags, { uuid: 'remove', name: 'remove' }],
      toRemoveTags: [{ uuid: 'remove', name: 'remove' }],
    });

    const saveButton = wrapper.findComponent('[data-testid="save-button"]');

    await saveButton.trigger('click');
    await flushPromises();
    expect(saveSpy).toHaveBeenCalled();
    expect(updateSectorExtraConfigsSpy).toHaveBeenCalled();
    expect(updateSectorTagsSpy).toHaveBeenCalled();

    saveSpy.mockClear();
    updateSectorExtraConfigsSpy.mockClear();
    updateSectorTagsSpy.mockClear();
  });

  it('should show alert on error in save configs', async () => {
    const alertSpy = vi.spyOn(unnnic, 'unnnicCallAlert');
    vi.spyOn(wrapper.vm, 'updateSectorTags');
    vi.spyOn(wrapper.vm, 'updateSectorExtraConfigs').mockRejectedValue(
      new Error('Erro ao atualizar configurações extras'),
    );

    try {
      await wrapper.vm.save();
    } catch (error) {
      console.log('test error', error);
    }

    expect(alertSpy).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('sector_update_error'),
        type: 'error',
      },
      seconds: 5,
    });
  });

  it('Should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
