/**
 * Auto Health self-ping disabled.
 * Backend /api/v1/health is kept available for external monitoring and uptime checks.
 */

export const keepAliveState = {
  status: "online",
  lastPing: null,
  latencyMs: null,
  pingCount: 0,
  listeners: new Set(),
};

export function subscribeKeepAlive(callback) {
  keepAliveState.listeners.add(callback);
  callback(keepAliveState);
  return () => keepAliveState.listeners.delete(callback);
}

export async function pingBackend() {
  // Auto-ping disabled
  return null;
}

export function initRenderKeepAlive() {
  // Auto-ping disabled
}
