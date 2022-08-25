const TOKEN_ITEM_LOCAL_STORAGE = 'WENICHATS_API_TOKEN';

export function get() {
  const token = localStorage.getItem(TOKEN_ITEM_LOCAL_STORAGE) || '';
  return token;
}

export async function set(token) {
  localStorage.setItem(TOKEN_ITEM_LOCAL_STORAGE, token);
}
