import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getToken,
  setToken,
  getProject,
  setProject,
  setStatus,
} from '@/utils/config';

let mockSessionStorage;
let mockLocalStorage;

describe('Config storage', () => {
  beforeEach(() => {
    mockSessionStorage = {};
    mockLocalStorage = {};

    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key) => mockSessionStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockSessionStorage[key] = value;
      }),
      clear: vi.fn(() => {
        Object.keys(mockSessionStorage).forEach(
          (key) => delete mockSessionStorage[key],
        );
      }),
    });

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      clear: vi.fn(() => {
        Object.keys(mockLocalStorage).forEach(
          (key) => delete mockLocalStorage[key],
        );
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token', () => {
    it('should get the token from sessionStorage first, then localStorage', () => {
      mockSessionStorage['WENICHATS_API_TOKEN'] = 'session-token';
      mockLocalStorage['WENICHATS_API_TOKEN'] = 'local-token';

      const token = getToken();

      expect(sessionStorage.getItem).toHaveBeenCalledWith(
        'WENICHATS_API_TOKEN',
      );
      expect(localStorage.getItem).not.toHaveBeenCalled();
      expect(token).toBe('session-token');
    });

    it('should fall back to localStorage if sessionStorage does not have the token', () => {
      mockLocalStorage['WENICHATS_API_TOKEN'] = 'local-token';

      const token = getToken();

      expect(sessionStorage.getItem).toHaveBeenCalledWith(
        'WENICHATS_API_TOKEN',
      );
      expect(localStorage.getItem).toHaveBeenCalledWith('WENICHATS_API_TOKEN');
      expect(token).toBe('local-token');
    });

    it('should return an empty string if no token is found', () => {
      const token = getToken();

      expect(token).toBe('');
    });

    it('should set the token in both sessionStorage and localStorage', async () => {
      const token = 'new-token';

      await setToken(token);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'WENICHATS_API_TOKEN',
        token,
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'WENICHATS_API_TOKEN',
        token,
      );
      expect(mockSessionStorage['WENICHATS_API_TOKEN']).toBe(token);
      expect(mockLocalStorage['WENICHATS_API_TOKEN']).toBe(token);
    });
  });

  describe('Project', () => {
    it('should get the project from sessionStorage first, then localStorage', () => {
      mockSessionStorage['WENICHATS_PROJECT_UUID'] = 'session-project';
      mockLocalStorage['WENICHATS_PROJECT_UUID'] = 'local-project';

      const project = getProject();

      expect(sessionStorage.getItem).toHaveBeenCalledWith(
        'WENICHATS_PROJECT_UUID',
      );
      expect(localStorage.getItem).not.toHaveBeenCalled();
      expect(project).toBe('session-project');
    });

    it('should fall back to localStorage if sessionStorage does not have the project', () => {
      mockLocalStorage['WENICHATS_PROJECT_UUID'] = 'local-project';

      const project = getProject();

      expect(sessionStorage.getItem).toHaveBeenCalledWith(
        'WENICHATS_PROJECT_UUID',
      );
      expect(localStorage.getItem).toHaveBeenCalledWith(
        'WENICHATS_PROJECT_UUID',
      );
      expect(project).toBe('local-project');
    });

    it('should return an empty string if no project is found', () => {
      const project = getProject();

      expect(project).toBe('');
    });

    it('should set the project in both sessionStorage and localStorage', async () => {
      const projectUuid = 'new-project-uuid';

      await setProject(projectUuid);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'WENICHATS_PROJECT_UUID',
        projectUuid,
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'WENICHATS_PROJECT_UUID',
        projectUuid,
      );
      expect(mockSessionStorage['WENICHATS_PROJECT_UUID']).toBe(projectUuid);
      expect(mockLocalStorage['WENICHATS_PROJECT_UUID']).toBe(projectUuid);
    });
  });

  describe('Status', () => {
    it('should set the status in sessionStorage only', async () => {
      const status = 'online';

      await setStatus(status);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'statusAgent',
        status,
      );
      expect(mockSessionStorage['statusAgent']).toBe(status);
    });
  });
});
