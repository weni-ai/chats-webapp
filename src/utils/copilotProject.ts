import env from '@/utils/env';

function getConnectUrl(): string {
  return String(env('MODULE_FEDERATION_CONNECT_URL') || '').replace(/\/$/, '');
}

export function buildCopilotProjectUrl(uuid: string): string {
  return `${getConnectUrl()}/projects/${uuid}`;
}

export function buildProjectCopilotSettingsUrl(uuid: string): string {
  return `${getConnectUrl()}/projects/${uuid}/settings/chats?tab=desk_copilot`;
}

export function buildCopilotConversationsUrl({
  projectUuid,
  roomUuid,
  start,
  end,
}: {
  projectUuid: string;
  roomUuid?: string;
  start?: string;
  end?: string;
}): string {
  const params = new URLSearchParams();

  if (roomUuid) {
    params.set('search', roomUuid);
  }
  if (start) {
    params.set('start', start);
  }
  if (end) {
    params.set('end', end);
  }

  const query = params.toString();

  return `${getConnectUrl()}/projects/${projectUuid}/ai-conversations/conversations${
    query ? `?${query}` : ''
  }`;
}
