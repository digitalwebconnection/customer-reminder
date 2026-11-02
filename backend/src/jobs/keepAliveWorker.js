/**
 * Auto Health self-ping worker disabled.
 * The /api/v1/health endpoint remains available for external monitoring and uptime checks.
 */

export function startKeepAliveWorker() {
  // Auto health self-ping disabled
  return () => {};
}
