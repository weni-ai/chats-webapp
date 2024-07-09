const TOKEN_ITEM_LOCAL_STORAGE = 'WENICHATS_API_TOKEN';
const PROJECT_ITEM_LOCAL_STORAGE = 'WENICHATS_PROJECT_UUID';
const STATUS_AGENT = 'statusAgent';

export function getToken() {
  const token = sessionStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE) || '';
  return token;
}

export async function setToken(token) {
  sessionStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token);
}

export function getProject() {
  const project = sessionStorage.getItem(PROJECT_ITEM_LOCAL_STORAGE) || '';
  return project;
}

export async function setProject(projectUuid) {
  sessionStorage.setItem(PROJECT_ITEM_LOCAL_STORAGE, projectUuid);
}

export async function setStatus(status) {
  sessionStorage.setItem(STATUS_AGENT, status);
}
