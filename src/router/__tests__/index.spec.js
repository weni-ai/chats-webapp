import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const mockNext = vi.fn();
const mockLogin = vi.fn();
const mockIsAuthenticated = vi.fn();
const mockIsTokenExpired = vi.fn(() => false);

vi.mock('is-mobile', () => ({
  default: vi.fn(() => true),
}));

vi.mock('@/services/keycloak', () => ({
  default: {
    isAuthenticated: (...args) => mockIsAuthenticated(...args),
    keycloak: {
      token: 'mock-token',
      login: (...args) => mockLogin(...args),
      isTokenExpired: (...args) => mockIsTokenExpired(...args),
    },
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

    isMobile.mockReturnValue(true);
  });

  const callGuard = (to = {}, from = {}) => {
    const mockTo = { name: 'chat', hash: '', ...to };
    const mockFrom = { ...from };
    mockNext.mockClear();
    return beforeEachGuard(mockTo, mockFrom, mockNext);
  };

  describe('desktop mode', () => {
    it('should skip keycloak auth and call next() directly', async () => {
      isMobile.mockReturnValue(false);

      await callGuard();

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });
  });

  describe('mobile mode — early return', () => {
    it('should skip auth when navigating internally with a valid token', async () => {
      configStore.token = 'existing-token';
      mockIsTokenExpired.mockReturnValue(false);

      await callGuard({}, { name: 'home' });

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });

    it('should NOT skip auth when token is expired', async () => {
      configStore.token = 'expired-token';
      mockIsTokenExpired.mockReturnValue(true);
      mockIsAuthenticated.mockResolvedValue(true);

      await callGuard({}, { name: 'home' });

      expect(mockIsAuthenticated).toHaveBeenCalled();
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

      await callGuard();

      expect(mockIsAuthenticated).toHaveBeenCalled();
      expect(configStore.token).toBe('mock-token');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should strip #state= hash after authentication', async () => {
      mockIsAuthenticated.mockResolvedValue(true);
      const to = { name: 'chat', hash: '#state=abc123' };

      await callGuard(to);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ hash: '' }),
      );
    });

    it('should redirect to login when not authenticated', async () => {
      mockIsAuthenticated.mockResolvedValue(false);

      await callGuard();

      expect(mockNext).toHaveBeenCalledWith(false);
      expect(mockLogin).toHaveBeenCalled();
    });

    it('should redirect to login on keycloak error', async () => {
      mockIsAuthenticated.mockRejectedValue(new Error('Network error'));

      await callGuard();

      expect(mockNext).toHaveBeenCalledWith(false);
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

  it('should set project uuid from session when store has no project', () => {
    afterEachGuard();

    expect(configStore.project.uuid).toBe('project-uuid');
  });
});
