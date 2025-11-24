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

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset module state
    vi.resetModules();
    const { default: freshKeycloakService } = await import('../keycloak');
    Object.assign(keycloakService, freshKeycloakService);

    mockKeycloakInstance = keycloakService.keycloak;
    mockKeycloakInstance.authenticated = false;
    mockKeycloakInstance.token = undefined;
    mockKeycloakInstance.refreshToken = undefined;
    mockKeycloakInstance.idToken = 'mock-id-token';
    mockKeycloakInstance.createLogoutUrl.mockReturnValue(
      'https://auth.example.com/logout',
    );
    mockKeycloakInstance.init = vi.fn();
    mockKeycloakInstance.updateToken = vi.fn();
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
        JSON.stringify({
          token: mockKeycloakInstance.token,
          refreshToken: mockKeycloakInstance.refreshToken,
          idToken: mockKeycloakInstance.idToken,
        }),
      );

      expect(mockKeycloakInstance.init).toHaveBeenCalledWith({
        useNonce: false,
        scope: 'email profile openid offline_access',
        pkceMethod: 'S256',
        ...savedUser,
      });

      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        60000,
      );

      expect(result).toBe(true);
    });

    it('should handle token refresh failure gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const error = new Error('Token refresh failed');
      const intervalCallback = () => {
        return mockKeycloakInstance.updateToken(70).catch((err) => {
          console.error('Failed to refresh token:', err);
        });
      };

      mockKeycloakInstance.updateToken.mockRejectedValue(error);

      await intervalCallback();

      expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(70);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh token:',
        error,
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle successful token refresh and save to storage', async () => {
      // Setup initial authentication
      global.sessionStorage.getItem.mockReturnValue(null);
      mockKeycloakInstance.init.mockResolvedValue(true);
      mockKeycloakInstance.authenticated = true;
      mockKeycloakInstance.token = 'initial-token';
      mockKeycloakInstance.refreshToken = 'initial-refresh';
      mockKeycloakInstance.idToken = 'initial-id';
      
      await keycloakService.isAuthenticated();

      // Get the interval callback
      const intervalCalls = global.setInterval.mock.calls;
      const refreshCallback = intervalCalls[intervalCalls.length - 1][0];

      // Setup for token refresh
      mockKeycloakInstance.token = 'refreshed-token';
      mockKeycloakInstance.refreshToken = 'refreshed-refresh-token';
      mockKeycloakInstance.idToken = 'refreshed-id-token';
      mockKeycloakInstance.updateToken.mockResolvedValue(true);

      // Clear previous calls
      global.sessionStorage.setItem.mockClear();

      // Execute refresh
      await refreshCallback();

      expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(70);
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'keycloak:user',
        JSON.stringify({
          token: 'refreshed-token',
          refreshToken: 'refreshed-refresh-token',
          idToken: 'refreshed-id-token',
        }),
      );
    });

    it('should handle token refresh returning false without saving', async () => {
      // Setup initial authentication
      global.sessionStorage.getItem.mockReturnValue(null);
      mockKeycloakInstance.init.mockResolvedValue(true);
      mockKeycloakInstance.authenticated = true;
      
      await keycloakService.isAuthenticated();

      // Get the interval callback
      const intervalCalls = global.setInterval.mock.calls;
      const refreshCallback = intervalCalls[intervalCalls.length - 1][0];

      // Setup for token refresh returning false
      mockKeycloakInstance.updateToken.mockResolvedValue(false);

      // Clear previous calls
      global.sessionStorage.setItem.mockClear();

      // Execute refresh
      await refreshCallback();

      expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(70);
      // Should not save to storage when refresh returns false
      expect(global.sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return cached result when already initialized', async () => {
      // First call to initialize
      global.sessionStorage.getItem.mockReturnValue(null);
      mockKeycloakInstance.init.mockResolvedValue(true);
      mockKeycloakInstance.authenticated = true;
      
      await keycloakService.isAuthenticated();
      
      // Clear mocks to verify second call doesn't initialize again
      vi.clearAllMocks();
      mockKeycloakInstance.authenticated = true;

      // Second call should return cached result
      const result = await keycloakService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockKeycloakInstance.init).not.toHaveBeenCalled();
      expect(global.sessionStorage.getItem).not.toHaveBeenCalled();
    });
  });
});
