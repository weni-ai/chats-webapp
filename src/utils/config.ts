import { moduleStorage } from '@/utils/storage';

const TOKEN_ITEM_LOCAL_STORAGE = 'token';
const PROJECT_ITEM_LOCAL_STORAGE = 'projectUuid';

export function getToken(): string {
  const token =
    moduleStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE, '', { useSession: true }) ||
    moduleStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE, '');
  return token;
}

export async function setToken(token: string): Promise<void> {
  moduleStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token, { useSession: true });
  moduleStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token);
}

export function getProject(): string {
  const project =
    moduleStorage.getItem(PROJECT_ITEM_LOCAL_STORAGE, '', {
      useSession: true,
    }) || moduleStorage.getItem(PROJECT_ITEM_LOCAL_STORAGE, '');
  return project;
}

export async function setProject(projectUuid: string): Promise<void> {
  moduleStorage.setItem(PROJECT_ITEM_LOCAL_STORAGE, projectUuid, {
    useSession: true,
  });
  moduleStorage.setItem(PROJECT_ITEM_LOCAL_STORAGE, projectUuid);
}

export async function setStatus(status: string): Promise<void> {
  const projectUuid = getProject();
  moduleStorage.setItem(`statusAgent-${projectUuid}`, status, {
    useSession: true,
  });
}
