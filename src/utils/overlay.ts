export function handleConnectOverlay(active: boolean) {
  window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
}
