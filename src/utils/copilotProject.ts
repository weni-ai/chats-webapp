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
