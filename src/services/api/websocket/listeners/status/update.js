import { useConfig } from '@/store/modules/config';

export default (content, { app }) => {
  const sessionStorageStatus = sessionStorage.getItem('statusAgent');
  const { from, status } = content;

  if (sessionStorageStatus !== status) {
    if (from === 'system') {
      app.updateStatus(sessionStorageStatus);
    } else if (from === 'user') {
      const configStore = useConfig();
      configStore.setStatus(status);
      sessionStorage.setItem('statusAgent', status);
    }
  }
};
