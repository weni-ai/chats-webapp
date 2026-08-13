import env from '@/utils/env';

export function buildCopilotProjectUrl(uuid: string): string {
  const connectUrl = String(env('MODULE_FEDERATION_CONNECT_URL') || '').replace(
    /\/$/,
    '',
  );

  return `${connectUrl}/projects/${uuid}`;
}
