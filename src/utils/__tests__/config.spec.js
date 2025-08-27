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
      mockSessionStorage['chats_token'] = 'session-token';
      mockLocalStorage['chats_token'] = 'local-token';

      const token = getToken();

      expect(sessionStorage.getItem).toHaveBeenCalledWith('chats_token');
      expect(localStorage.getItem).not.toHaveBeenCalled();
      expect(token).toBe('session-token');
    });

    it('should fall back to localStorage if sessionStorage does not have the token', () => {
      mockLocalStorage['chats_token'] = 'local-token';

      const token = getToken();

      expect(sessionStorage.getItem).toHaveBeenCalledWith('chats_token');
      expect(localStorage.getItem).toHaveBeenCalledWith('chats_token');
      expect(token).toBe('local-token');
    });

    it('should return an empty string if no token is found', () => {
      const token = getToken();

      expect(token).toBe('');
    });

    it('should set the token in both sessionStorage and localStorage', async () => {
      const token = 'new-token';

      await setToken(token);

      expect(sessionStorage.setItem).toHaveBeenCalledWith('chats_token', token);
      expect(localStorage.setItem).toHaveBeenCalledWith('chats_token', token);
      expect(mockSessionStorage['chats_token']).toBe(token);
      expect(mockLocalStorage['chats_token']).toBe(token);
    });
  });

  describe('Project', () => {
    it('should get the project from sessionStorage first, then localStorage', () => {
      mockSessionStorage['chats_projectUuid'] = 'session-project';
      mockLocalStorage['chats_projectUuid'] = 'local-project';

      const project = getProject();

      expect(sessionStorage.getItem).toHaveBeenCalledWith('chats_projectUuid');
      expect(localStorage.getItem).not.toHaveBeenCalled();
      expect(project).toBe('session-project');
    });

    it('should fall back to localStorage if sessionStorage does not have the project', () => {
      mockLocalStorage['chats_projectUuid'] = 'local-project';

      const project = getProject();

      expect(sessionStorage.getItem).toHaveBeenCalledWith('chats_projectUuid');
      expect(localStorage.getItem).toHaveBeenCalledWith('chats_projectUuid');
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
        'chats_projectUuid',
        projectUuid,
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'chats_projectUuid',
        projectUuid,
      );
      expect(mockSessionStorage['chats_projectUuid']).toBe(projectUuid);
      expect(mockLocalStorage['chats_projectUuid']).toBe(projectUuid);
    });
  });

  describe('Status', () => {
    it('should set the status in sessionStorage with project UUID', async () => {
      const status = 'online';
      const projectUuid = 'test-project-uuid';

      mockSessionStorage['chats_projectUuid'] = projectUuid;

      await setStatus(status);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        `chats_statusAgent-${projectUuid}`,
        status,
      );
      expect(mockSessionStorage[`chats_statusAgent-${projectUuid}`]).toBe(
        status,
      );
    });
  });
});
