import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import keycloakService from '../keycloak';

vi.mock('keycloak-js', () => ({
  default: vi.fn().mockImplementation(() => ({
    authenticated: false,
    idToken: 'mock-id-token',
    createLogoutUrl: vi.fn(() => 'https://auth.example.com/logout'),
    init: vi.fn(),
    updateToken: vi.fn(),
  })),
}));

vi.mock('@/utils/env', () => ({
  default: vi.fn((key) => {
    const config = {
      KEYCLOAK_ISSUER: 'https://auth.example.com',
      KEYCLOAK_CLIENT_ID: 'test-client-id',
      KEYCLOAK_REALM: 'test-realm',
    };
    return config[key];
  }),
}));

Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    location: {
      replace: vi.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(global, 'setInterval', {
  value: vi.fn(),
  writable: true,
});

describe('Keycloak Service', () => {
  const mockConfig = {
    KEYCLOAK_ISSUER: 'https://auth.example.com',
    KEYCLOAK_CLIENT_ID: 'test-client-id',
    KEYCLOAK_REALM: 'test-realm',
  };

  let mockKeycloakInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    mockKeycloakInstance = keycloakService.keycloak;
    mockKeycloakInstance.authenticated = false;
    mockKeycloakInstance.createLogoutUrl.mockReturnValue(
      'https://auth.example.com/logout',
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should expose keycloak instance', () => {
      expect(keycloakService.keycloak).toBeDefined();
      expect(keycloakService.keycloak.authenticated).toBeDefined();
      expect(keycloakService.keycloak.idToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should remove user from sessionStorage and redirect to logout URL', () => {
      keycloakService.keycloak.logout();

      expect(global.sessionStorage.removeItem).toHaveBeenCalledWith(
        'keycloak:user',
      );
      expect(mockKeycloakInstance.createLogoutUrl).toHaveBeenCalled();
      expect(global.window.location.replace).toHaveBeenCalledWith(
        `https://auth.example.com/logout&client_id=${encodeURIComponent(
          mockConfig.KEYCLOAK_CLIENT_ID,
        )}&id_token_hint=${encodeURIComponent(mockKeycloakInstance.idToken)}`,
      );
    });
  });

  describe('plugin', () => {
    it('should install Vue plugin correctly', () => {
      const mockVue = {
        prototype: {},
      };

      keycloakService.plugin.install(mockVue);

      expect(mockVue.prototype.$keycloak).toBeDefined();
      expect(mockVue.prototype.$keycloak).toBe(keycloakService.keycloak);
    });
  });

  describe('isAuthenticated', () => {
    it('should initialize keycloak and handle all scenarios in first call', async () => {
      const savedUser = {
        token: 'saved-token',
        refreshToken: 'saved-refresh-token',
      };
      global.sessionStorage.getItem.mockReturnValue(JSON.stringify(savedUser));
      mockKeycloakInstance.init.mockResolvedValue(true);
      mockKeycloakInstance.updateToken.mockResolvedValue(true);

      const result = await keycloakService.isAuthenticated();

      expect(global.sessionStorage.getItem).toHaveBeenCalledWith(
        'keycloak:user',
      );
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'keycloak:user',
        JSON.stringify(mockKeycloakInstance),
      );

      expect(mockKeycloakInstance.init).toHaveBeenCalledWith({
        useNonce: false,
        scope: 'email profile openid offline_access',
        pkceMethod: 'S256',
        ...savedUser,
      });

      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        6000,
      );

      expect(result).toBe(true);
    });

    it('should handle token refresh failure gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const intervalCallback = () => {
        return mockKeycloakInstance.updateToken(70).catch(() => {
          console.error('Failed to refresh token');
        });
      };

      mockKeycloakInstance.updateToken.mockRejectedValue(
        new Error('Token refresh failed'),
      );

      await intervalCallback();

      expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(70);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh token');

      consoleErrorSpy.mockRestore();
    });

    it('should log error message on token refresh failure', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.resetModules();
      const { default: freshKeycloakService } = await import('../keycloak');
      const freshMockInstance = freshKeycloakService.keycloak;

      global.sessionStorage.getItem.mockReturnValue(null);
      freshMockInstance.init.mockResolvedValue(true);
      freshMockInstance.updateToken.mockRejectedValue(
        new Error('Token expired'),
      );

      await freshKeycloakService.isAuthenticated();

      const intervalCalls = global.setInterval.mock.calls;
      const actualCallback = intervalCalls[0][0];
      await actualCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh token');

      consoleErrorSpy.mockRestore();
    });

    it('should return cached result when already initialized', async () => {
      mockKeycloakInstance.authenticated = true;
      vi.clearAllMocks();

      const result = await keycloakService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockKeycloakInstance.init).not.toHaveBeenCalled();
    });
  });
});
