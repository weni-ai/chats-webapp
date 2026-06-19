import { emitToHost } from '@/utils/hostBridge';

export function handleConnectOverlay(active: boolean) {
  emitToHost('changeOverlay', { data: active });
}
