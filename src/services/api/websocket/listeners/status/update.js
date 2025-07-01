import { useConfig } from '@/store/modules/config';

export default (content, { app }) => {
  const configStore = useConfig();

  const statusAgentKey = configStore.project.uuid
    ? `statusAgent-${configStore.project.uuid}`
    : `statusAgent-${sessionStorage.getItem('WENICHATS_PROJECT_UUID')}`;

  const sessionStorageStatus = sessionStorage.getItem(statusAgentKey);
  const { from, status } = content;

  if (sessionStorageStatus !== status) {
    if (from === 'system') {
      app.updateUserStatus(sessionStorageStatus);
    } else if (from === 'user') {
      const configStore = useConfig();
      configStore.setStatus(status);
      sessionStorage.setItem(statusAgentKey, status);
    }
  }
};
