import { useConfig } from '@/store/modules/config';

export default (content, { app }) => {
  const localStorageStatus = localStorage.getItem('statusAgent');
  const { from, status } = content;

  if (localStorageStatus !== status) {
    if (from === 'system') {
      app.updateStatus(localStorageStatus);
    } else if (from === 'user') {
      const configStore = useConfig();
      configStore.setStatus(status);
      localStorage.setItem('statusAgent', status);
    }
  }
};
