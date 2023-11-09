const TOKEN_ITEM_LOCAL_STORAGE = 'WENICHATS_API_TOKEN';
const PROJECT_ITEM_LOCAL_STORAGE = 'WENICHATS_PROJECT_UUID';

export function getToken() {
  const token = localStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE) || '';
  return token;
}

export async function setToken(token) {
  console.log('setting token:', token);
  localStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token);
}

export function getProject() {
  const project = localStorage.getItem(PROJECT_ITEM_LOCAL_STORAGE) || '';
  return project;
}

export async function setProject(token) {
  localStorage.setItem(PROJECT_ITEM_LOCAL_STORAGE, token);
}
