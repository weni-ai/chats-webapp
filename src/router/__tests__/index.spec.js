import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const mockLogin = vi.fn();
const mockIsAuthenticated = vi.fn();
const mockIsTokenExpired = vi.fn(() => false);
const mockKeycloak = {
  token: 'mock-token',
  login: (...args) => mockLogin(...args),
  isTokenExpired: (...args) => mockIsTokenExpired(...args),
};

vi.mock('is-mobile', () => ({
  default: vi.fn(() => true),
}));

vi.mock('@/services/keycloak', () => ({
  default: {
    isAuthenticated: (...args) => mockIsAuthenticated(...args),
    keycloak: mockKeycloak,
  },
}));

vi.mock('@/utils/config', () => ({
  getProject: vi.fn(() => 'project-uuid'),
  getToken: vi.fn(() => 'fallback-token'),
  setToken: vi.fn(),
  setProject: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('@/utils/env', () => ({
  default: vi.fn(() => '/'),
}));

vi.mock('../routes', () => ({
  default: [
    { path: '/', name: 'home', component: { template: '<div />' } },
    { path: '/chat', name: 'chat', component: { template: '<div />' } },
  ],
}));

vi.mock('../middlewares/afterEach', () => ({
  default: [],
}));

import isMobile from 'is-mobile';
import { useConfig } from '@/store/modules/config';

let beforeEachGuard;
let afterEachGuard;

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    createRouter: vi.fn((options) => {
      const fakeRouter = {
        options,
        beforeEach: vi.fn((guard) => {
          beforeEachGuard = guard;
        }),
        afterEach: vi.fn((guard) => {
          afterEachGuard = guard;
        }),
      };
      return fakeRouter;
    }),
    createWebHistory: vi.fn(),
  };
});

describe('Router beforeEach guard', () => {
  let configStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    setActivePinia(createPinia());

    beforeEachGuard = null;
    afterEachGuard = null;

    vi.resetModules();

    await import('../index');
    configStore = useConfig();

    mockKeycloak.token = 'mock-token';
    isMobile.mockReturnValue(true);
  });

  const callGuard = (to = {}, from = {}) => {
    const mockTo = { name: 'chat', hash: '', ...to };
    const mockFrom = { ...from };
    return beforeEachGuard(mockTo, mockFrom);
  };

  describe('desktop mode', () => {
    it('should skip keycloak auth and return true', async () => {
      isMobile.mockReturnValue(false);

      const result = await callGuard();

      expect(result).toBe(true);
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });
  });

  describe('mobile mode — early return', () => {
    it('should skip auth when navigating internally with a valid token', async () => {
      configStore.token = 'existing-token';
      mockIsTokenExpired.mockReturnValue(false);

      const result = await callGuard({}, { name: 'home' });

      expect(result).toBe(true);
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });

    it('should NOT skip auth when there is no token in the store', async () => {
      configStore.token = '';
      mockIsAuthenticated.mockResolvedValue(true);

      await callGuard({}, { name: 'home' });

      expect(mockIsAuthenticated).toHaveBeenCalled();
    });

    it('should NOT skip auth on initial navigation (no from.name)', async () => {
      configStore.token = 'existing-token';
      mockIsAuthenticated.mockResolvedValue(true);

      await callGuard({}, { name: undefined });

      expect(mockIsAuthenticated).toHaveBeenCalled();
    });
  });

  describe('mobile mode — authentication flow', () => {
    it('should authenticate and set token on success', async () => {
      mockIsAuthenticated.mockResolvedValue(true);

      const result = await callGuard();

      expect(mockIsAuthenticated).toHaveBeenCalled();
      expect(configStore.token).toBe('mock-token');
      expect(result).toBe(true);
    });

    it('should strip #state= hash after authentication', async () => {
      mockIsAuthenticated.mockResolvedValue(true);
      const to = { name: 'chat', hash: '#state=abc123' };

      const result = await callGuard(to);

      expect(result).toEqual(expect.objectContaining({ hash: '' }));
    });

    it('should redirect to login when not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      const result = await callGuard();

      expect(result).toBe(false);
      expect(mockLogin).toHaveBeenCalled();
    });

    it('should redirect to login on keycloak error', async () => {
      mockIsAuthenticated.mockRejectedValue(new Error('Network error'));

      const result = await callGuard();

      expect(result).toBe(false);
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});

describe('Router afterEach guard', () => {
  let configStore;

  beforeEach(async () => {
    vi.clearAllMocks();
    setActivePinia(createPinia());

    beforeEachGuard = null;
    afterEachGuard = null;

    vi.resetModules();
    await import('../index');
    configStore = useConfig();
  });

  it('should set token from session when store has no token', () => {
    configStore.token = '';

    afterEachGuard();

    expect(configStore.token).toBe('fallback-token');
  });

  it('should set project uuid from session when store has no project (desktop)', () => {
    isMobile.mockReturnValue(false);

    afterEachGuard();

    expect(configStore.project.uuid).toBe('project-uuid');
  });

  it('should NOT set project uuid from session on mobile', () => {
    isMobile.mockReturnValue(true);

    afterEachGuard();

    expect(configStore.project.uuid).toBeFalsy();
  });
});
