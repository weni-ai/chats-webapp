import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { ASSISTED_SALES_FEATURE_FLAG } from '@/composables/useAssistedSalesFeatureFlag';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import Copilot from '@/services/api/resources/chats/copilot';
import {
  resetCopilotConnectionState,
  useCopilotConnection,
} from '../useCopilotConnection';

vi.mock('@/services/api/resources/chats/copilot', async () => {
  const actual = await vi.importActual(
    '@/services/api/resources/chats/copilot',
  );

  return {
    ...actual,
    default: {
      listConnections: vi.fn(),
    },
  };
});

const defaultConnection = {
  socketUrl: 'wss://websocket.weni.ai',
  channelUuid: 'channel-default',
  host: 'https://flows.weni.ai',
  connectOn: 'mount',
  storage: 'local',
  callbackUrl: '',
};

describe('useCopilotConnection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetCopilotConnectionState();
    vi.clearAllMocks();

    const configStore = useConfig();
    configStore.project = {
      uuid: 'project-uuid',
      name: 'Desk',
      config: {},
    };
  });

  function enableAssistedSales() {
    const featureFlagStore = useFeatureFlag();
    featureFlagStore.featureFlags = {
      active_features: [ASSISTED_SALES_FEATURE_FLAG],
    };
    featureFlagStore.featureFlagsLoaded = true;
  }

  it('does not list connections before the feature flag resolves', async () => {
    useCopilotConnection();
    await nextTick();

    expect(Copilot.listConnections).not.toHaveBeenCalled();
  });

  it('lists connections after the flag is loaded and the project uuid exists', async () => {
    Copilot.listConnections.mockResolvedValue([]);
    useCopilotConnection();
    enableAssistedSales();
    await nextTick();
    await flushPromises();

    expect(Copilot.listConnections).toHaveBeenCalledWith({
      isPrincipal: false,
    });
  });

  it('does not list connections when the flag is loaded but disabled', async () => {
    useCopilotConnection();
    const featureFlagStore = useFeatureFlag();
    featureFlagStore.featureFlagsLoaded = true;
    featureFlagStore.featureFlags = { active_features: [] };
    await nextTick();

    expect(Copilot.listConnections).not.toHaveBeenCalled();
  });

  it('waits for the project uuid before listing connections', async () => {
    Copilot.listConnections.mockResolvedValue([]);
    const configStore = useConfig();
    configStore.project = { uuid: '', name: 'Desk', config: {} };
    enableAssistedSales();

    useCopilotConnection();
    await nextTick();
    expect(Copilot.listConnections).not.toHaveBeenCalled();

    configStore.project = {
      uuid: 'project-uuid',
      name: 'Desk',
      config: {},
    };
    await nextTick();
    await flushPromises();

    expect(Copilot.listConnections).toHaveBeenCalledWith({
      isPrincipal: false,
    });
  });

  it('is not configured when there are no connections', async () => {
    Copilot.listConnections.mockResolvedValue([]);

    const { isConfigured, connection, reload } = useCopilotConnection();
    await reload();

    expect(Copilot.listConnections).toHaveBeenCalledWith({
      isPrincipal: false,
    });
    expect(isConfigured.value).toBe(false);
    expect(connection.value).toBeUndefined();
  });

  it('picks the first connection when the project is not principal', async () => {
    Copilot.listConnections.mockResolvedValue([
      { conection: defaultConnection },
    ]);

    const { connection, isConfigured, reload } = useCopilotConnection();
    await reload();

    expect(isConfigured.value).toBe(true);
    expect(connection.value).toEqual(defaultConnection);
  });

  it('picks the connection matching the room sector when the project is principal', async () => {
    const configStore = useConfig();
    configStore.project.config = { its_principal: true };

    Copilot.listConnections.mockResolvedValue([
      {
        sector: 'sector-1',
        conection: { ...defaultConnection, channelUuid: 'channel-1' },
      },
      {
        sector: 'sector-2',
        conection: { ...defaultConnection, channelUuid: 'channel-2' },
      },
    ]);

    const room = ref({
      uuid: 'room-1',
      queue: { sector: 'sector-2' },
    });

    const { connection, isConfigured, reload } = useCopilotConnection(room);
    await reload();

    expect(Copilot.listConnections).toHaveBeenCalledWith({
      isPrincipal: true,
    });
    expect(isConfigured.value).toBe(true);
    expect(connection.value?.channelUuid).toBe('channel-2');
  });

  it('is not configured when the principal project has no matching sector', async () => {
    const configStore = useConfig();
    configStore.project.config = { its_principal: true };

    Copilot.listConnections.mockResolvedValue([
      {
        sector: 'sector-1',
        conection: { ...defaultConnection, channelUuid: 'channel-1' },
      },
    ]);

    const room = ref({
      uuid: 'room-1',
      queue: { sector: 'sector-missing' },
    });

    const { connection, isConfigured, reload } = useCopilotConnection(room);
    await reload();

    expect(isConfigured.value).toBe(false);
    expect(connection.value).toBeUndefined();
  });
});
