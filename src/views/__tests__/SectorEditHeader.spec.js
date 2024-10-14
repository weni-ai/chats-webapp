import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';

import SectorEditHeader from '@/views/Settings/Sectors/Edit/SectorEditHeader.vue';

const createWrapper = (props) => {
  return mount(SectorEditHeader, {
    props,
  });
};

describe('SectorEditHeader.vue', () => {
  let wrapper;
  const sectorName = 'Sector 1';

  beforeEach(() => {
    wrapper = createWrapper({ sectorName });
  });

  it('should renders the sector title and description', () => {
    const headerTitle = wrapper.find('[data-testid=header-title]');
    const headerDescription = wrapper.find('[data-testid=header-description]');

    expect(headerTitle.text()).toBe(
      `${wrapper.vm.$t('sector.title')} ${sectorName}`,
    );
    expect(headerDescription.text()).toBe(
      wrapper.vm.$t('config_chats.edit_sector.description'),
    );
  });

  it('Should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
