import i18n from '@/plugins/i18n';

const { t } = i18n.global;

export const statusLabel = (status: string): string => {
  if (status === 'FAILED') {
    return t('mass_message.history.status_failed');
  }
  return t('mass_message.history.status_sent');
};

export const statusScheme = (status: string): string => {
  return status === 'FAILED' ? 'red' : 'green';
};
