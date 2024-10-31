import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';

import SettingsSectors from '@/views/Settings/SettingsSectors.vue';

import { createTestingPinia } from '@pinia/testing';
import { useSettings } from '@/store/modules/settings';

const store = createTestingPinia({
  initialState: {
    config: {
      project: { name: 'Project 1' },
    },
    settings: {
      sectors: [
        {
          id: 1,
          uuid: '123',
          name: 'Sector 1',
          agents: 10,
          contacts: 50,
        },
      ],
      isLoadingSectors: false,
    },
  },
});

const createWrapper = (props) => {
  return mount(SettingsSectors, {
    props,
    global: {
      plugins: [store],
      stubs: {
        UnnnicCard: true,
        UnnnicCardProject: true,
        NewSectorDrawer: true,
      },
      mocks: {
        $router: {
          push: vi.fn(),
        },
      },
    },
  });
};

describe('SettingsHeader.vue', () => {
  let wrapper;
  let settingsStore;

  beforeEach(() => {
    settingsStore = useSettings();

    wrapper = createWrapper();
  });

  it('should render the SettingsSectionHeader with correct props', () => {
    const header = wrapper.findComponent(
      '[data-testid=settings-sectors-header]',
    );

    expect(header.exists()).toBe(true);
    expect(header.props('title')).toBe(
      wrapper.vm.$t('config_chats.section_sectors_title', {
        project: 'Project 1',
      }),
    );
    expect(header.props('subtitle')).toBe(
      wrapper.vm.$t('config_chats.section_sectors_subtitle'),
    );
  });

  it('should render the card for creating a new sector', async () => {
    const newSectorCard = wrapper.findComponent(
      '[data-testid=settings-sectors-blank-card]',
    );

    expect(newSectorCard.exists()).toBe(true);
    expect(newSectorCard.props('text')).toBe(
      wrapper.vm.$t('config_chats.new_sector'),
    );
    expect(newSectorCard.props('icon')).toBe('add');

    newSectorCard.trigger('click');

    await wrapper.vm.$nextTick();

    const newSectorDrawer = wrapper.find('[data-testid="new-sector-drawer"]');
    expect(newSectorDrawer.exists()).toBe(true);
  });

  it('should render the correct number of card components', () => {
    const sectorCards = wrapper.findAllComponents(
      '[data-testid=settings-sectors-sector-card]',
    );

    expect(sectorCards.length).toBe(1);

    const sectorCard = sectorCards[0];
    expect(sectorCard.props('name')).toBe('Sector 1');

    sectorCard.trigger('action');
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
      name: 'sectors.edit',
      params: { uuid: '123' },
    });
  });

  it('should display the loading section when sectors are loading', async () => {
    settingsStore.isLoadingSectors = true;

    await wrapper.vm.$nextTick();

    const loadingSection = wrapper.find(
      '[data-testid=settings-sectors-loading-section]',
    );

    expect(loadingSection.exists()).toBe(true);
    expect(loadingSection.find('img').attributes('src')).toContain(
      'LogoWeniAnimada4.svg',
    );
  });

  it('should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
