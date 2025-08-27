import { useConfig } from '@/store/modules/config';
import { moduleStorage } from '@/utils/storage';

export default (content, { app }) => {
  const configStore = useConfig();

  const statusAgentKey = configStore.project.uuid
    ? `statusAgent-${configStore.project.uuid}`
    : `statusAgent-${moduleStorage.getItem('projectUuid', '', {
        useSession: true,
      })}`;

  const sessionStorageStatus = moduleStorage.getItem(statusAgentKey, null, {
    useSession: true,
  });
  const { from, status } = content;

  if (sessionStorageStatus !== status) {
    if (from === 'system') {
      app.updateUserStatus(sessionStorageStatus);
    } else if (from === 'user') {
      const configStore = useConfig();
      configStore.setStatus(status);
      moduleStorage.setItem(statusAgentKey, status, {
        useSession: true,
      });
    }
  }
};
