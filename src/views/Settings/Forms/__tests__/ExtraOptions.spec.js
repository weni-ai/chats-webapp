import {
  expect,
  describe,
  it,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { config, flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createTestingPinia } from '@pinia/testing';

import { createMemoryHistory, createRouter } from 'vue-router';

import i18n from '@/plugins/i18n';

import { useConfig } from '@/store/modules/config';

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
  automatic_message_queue: {
    is_active: false,
    text: '',
  },
  automatic_message: {
    is_active: false,
    text: '',
  },
  inactivity_timeout: {
    is_message_timeout_enabled: false,
    message_timeout_text: '',
    message_timeout_time: null,

    is_close_room_enabled: false,
    close_room_message_text: '',
    close_room_timeout_time: null,
  },
  is_csat_enabled: false,
  custom_csat_flow_uuid: null,
};

const routes = [{ path: '/settings', name: 'settings' }];
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.push = vi.fn();

function createWrapper(props = {}, { projectLanguage = 'en-us' } = {}) {
  const wrapper = mount(FormSectorExtraOptions, {
    props: { modelValue: sectorExtraOptionsMock, isEditing: false, ...props },
    global: {
      plugins: [
        router,
        createTestingPinia({
          initialState: {
            config: {
              project: {
                name: '',
                config: {},
                uuid: '',
                language: projectLanguage,
              },
            },
          },
        }),
      ],
      stubs: {
        UnnnicSwitch: true,
      },
    },
  });

  return wrapper;
}

function setProjectLanguage(language, pinia) {
  const configStore = useConfig(pinia);
  configStore.project = {
    ...configStore.project,
    language,
  };
}

describe('SectorExtraOptions', () => {
  let savedTMock;

  beforeAll(() => {
    savedTMock = config.global.mocks.$t;
    delete config.global.mocks.$t;
  });

  afterAll(() => {
    config.global.mocks.$t = savedTMock;
  });

  let wrapper;

  beforeEach(async () => {
    i18n.global.locale.value = 'en';
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

    expect(switchs.length).toBe(4);

    expect(switchs[0].props().textRight).toContain(
      wrapper.vm.translationTriggerFlows,
    );

    expect(switchs[1].props().textRight).toContain(
      wrapper.vm.translationSignMessages,
    );

    expect(switchs[2].props().textRight).toContain(
      wrapper.vm.$t('sector.additional_options.edit_custom_fields.label'),
    );
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

    const toAddTagsNames = wrapper.vm.toAddTags.map((tag) => tag.name);
    const tagssNames = wrapper.vm.tags.map((tag) => tag.name);

    expect(toAddTagsNames.includes('Financeiro')).toBe(false);
    expect(tagssNames.includes('Financeiro')).toBe(false);
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

  describe('validForm with CSAT', () => {
    it('should be valid when SatisfactionSurveySection emits true', async () => {
      await wrapper.setData({ csatValid: true });
      expect(wrapper.vm.validForm).toBe(true);
    });

    it('should be invalid when SatisfactionSurveySection emits false', async () => {
      await wrapper.setData({ csatValid: false });
      expect(wrapper.vm.validForm).toBe(false);
    });

    it('should sync csatValid from change-is-valid event', async () => {
      const section = wrapper.findComponent({
        name: 'SatisfactionSurveySection',
      });
      section.vm.$emit('change-is-valid', false);
      await flushPromises();
      expect(wrapper.vm.csatValid).toBe(false);
    });
  });

  it('should send custom_csat_flow_uuid in update payload', async () => {
    const sectorService = (
      await import('@/services/api/resources/settings/sector')
    ).default;
    const updateSpy = vi.spyOn(sectorService, 'update');

    await wrapper.setProps({
      modelValue: {
        ...sectorExtraOptionsMock,
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'flow-uuid',
      },
    });

    await wrapper.vm.updateSectorExtraConfigs();

    expect(updateSpy).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'flow-uuid',
      }),
    );
  });

  it('should null custom_csat_flow_uuid in payload when csat is disabled', async () => {
    const sectorService = (
      await import('@/services/api/resources/settings/sector')
    ).default;
    const updateSpy = vi.spyOn(sectorService, 'update');

    await wrapper.setProps({
      modelValue: {
        ...sectorExtraOptionsMock,
        is_csat_enabled: false,
        custom_csat_flow_uuid: 'flow-uuid',
      },
    });

    await wrapper.vm.updateSectorExtraConfigs();

    expect(updateSpy).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        is_csat_enabled: false,
        custom_csat_flow_uuid: null,
      }),
    );
  });

  describe('inactivity timeout default messages', () => {
    const inactivityTimeoutMock = {
      is_message_timeout_enabled: false,
      message_timeout_text: '',
      message_timeout_time: null,
      is_close_room_enabled: false,
      close_room_message_text: '',
      close_room_timeout_time: null,
    };

    beforeEach(async () => {
      setProjectLanguage('en-us', wrapper.vm.$pinia);
      await wrapper.setProps({
        modelValue: {
          ...sectorExtraOptionsMock,
          inactivity_timeout: { ...inactivityTimeoutMock },
        },
      });
      await flushPromises();
    });

    it('should use project language for the warning message', async () => {
      setProjectLanguage('pt-br', wrapper.vm.$pinia);
      await nextTick();

      wrapper.vm.handleInactivityTimeoutIsMessageTimeoutEnabled(true);

      expect(wrapper.vm.sector.inactivity_timeout.message_timeout_text).toBe(
        'Você ainda está aí? Esta sessão será encerrada em breve se não houver resposta.',
      );
    });

    it('should use project language for the close room message', async () => {
      setProjectLanguage('pt-br', wrapper.vm.$pinia);
      await nextTick();

      wrapper.vm.handleInactivityTimeoutIsCloseRoomEnabled(true);

      expect(wrapper.vm.sector.inactivity_timeout.close_room_message_text).toBe(
        'Esta sessão foi encerrada por inatividade. Fique à vontade para iniciar um novo chat a qualquer momento!',
      );
    });

    it('should use english default messages when project language is en-us', async () => {
      const localWrapper = createWrapper({}, { projectLanguage: 'en-us' });
      await flushPromises();

      localWrapper.vm.handleInactivityTimeoutIsMessageTimeoutEnabled(true);
      localWrapper.vm.handleInactivityTimeoutIsCloseRoomEnabled(true);

      expect(
        localWrapper.vm.sector.inactivity_timeout.message_timeout_text,
      ).toBe(
        "Are you still there? This session will end soon if there's no response.",
      );
      expect(
        localWrapper.vm.sector.inactivity_timeout.close_room_message_text,
      ).toBe(
        'This session has ended due to inactivity. Feel free to start a new chat anytime!',
      );
    });

    it('should not update warning message when project language changes after enable', async () => {
      const localWrapper = createWrapper({}, { projectLanguage: 'pt-br' });
      await flushPromises();

      localWrapper.vm.handleInactivityTimeoutIsMessageTimeoutEnabled(true);

      setProjectLanguage('en-us', localWrapper.vm.$pinia);
      await nextTick();

      expect(
        localWrapper.vm.sector.inactivity_timeout.message_timeout_text,
      ).toBe(
        'Você ainda está aí? Esta sessão será encerrada em breve se não houver resposta.',
      );
    });

    it('should not update warning message when project language changes after customization', async () => {
      const localWrapper = createWrapper({}, { projectLanguage: 'pt-br' });
      await flushPromises();

      localWrapper.vm.handleInactivityTimeoutIsMessageTimeoutEnabled(true);
      localWrapper.vm.sector.inactivity_timeout.message_timeout_text =
        'Mensagem personalizada';

      setProjectLanguage('en-us', localWrapper.vm.$pinia);
      await nextTick();

      expect(
        localWrapper.vm.sector.inactivity_timeout.message_timeout_text,
      ).toBe('Mensagem personalizada');
    });

    it('should use romanian default messages when project language is ro', async () => {
      const localWrapper = createWrapper({}, { projectLanguage: 'ro' });
      await flushPromises();

      localWrapper.vm.handleInactivityTimeoutIsMessageTimeoutEnabled(true);
      localWrapper.vm.handleInactivityTimeoutIsCloseRoomEnabled(true);

      expect(
        localWrapper.vm.sector.inactivity_timeout.message_timeout_text,
      ).toBe(
        'Mai ești aici? Dacă nu există niciun răspuns, această sesiune va fi închisă în curând.',
      );
      expect(
        localWrapper.vm.sector.inactivity_timeout.close_room_message_text,
      ).toBe(
        'Această sesiune s-a încheiat din cauza inactivității. Poți începe o nouă conversație oricând!',
      );
    });
  });

  it('Should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
