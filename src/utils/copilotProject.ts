import env from '@/utils/env';

export function buildCopilotProjectUrl(uuid: string): string {
  const dashboardUrl = String(env('WENI_DASHBOARD_URL') || '').replace(
    /\/$/,
    '',
  );

  return `${dashboardUrl}/projects/${uuid}`;
}
