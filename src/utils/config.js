import { moduleStorage } from '@/utils/storage';

const TOKEN_ITEM_LOCAL_STORAGE = 'token';
const PROJECT_ITEM_LOCAL_STORAGE = 'projectUuid';

export function getToken() {
  const token =
    moduleStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE, '', { useSession: true }) ||
    moduleStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE, '');
  return token;
}

export async function setToken(token) {
  moduleStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token, { useSession: true });
  moduleStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token);
}

export function getProject() {
  const project =
    moduleStorage.getItem(PROJECT_ITEM_LOCAL_STORAGE, '', {
      useSession: true,
    }) || moduleStorage.getItem(PROJECT_ITEM_LOCAL_STORAGE, '');
  return project;
}

export async function setProject(projectUuid) {
  moduleStorage.setItem(PROJECT_ITEM_LOCAL_STORAGE, projectUuid, {
    useSession: true,
  });
  moduleStorage.setItem(PROJECT_ITEM_LOCAL_STORAGE, projectUuid);
}

export async function setStatus(status) {
  const projectUuid = getProject();
  moduleStorage.setItem(`statusAgent-${projectUuid}`, status, {
    useSession: true,
  });
}
