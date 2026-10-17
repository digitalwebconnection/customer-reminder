/**
 * Render 14-Minute Keep-Alive Client
 * 
 * Free-tier Render web services spin down after 15 minutes of inactivity.
 * This client pings the backend every 14 minutes (840,000 ms) while the website
 * is open in the browser to keep the Render backend 100% active and responsive.
 */

import api from '../api/axios';

const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
let keepAliveTimer = null;
let lastPingTimestamp = 0;

export const keepAliveState = {
  status: 'connecting', // 'online' | 'connecting' | 'offline'
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

function notifyListeners() {
  for (const listener of keepAliveState.listeners) {
    try {
      listener({ ...keepAliveState });
    } catch (e) {}
  }
}

export async function pingBackend() {
  const startTime = Date.now();
  try {
    const res = await api.get('/health', {
      headers: { 'X-Keep-Alive': 'remindiq-client-14m' },
      timeout: 15000,
    });

    const elapsed = Date.now() - startTime;
    lastPingTimestamp = Date.now();
    keepAliveState.status = 'online';
    keepAliveState.lastPing = new Date();
    keepAliveState.latencyMs = elapsed;
    keepAliveState.pingCount += 1;
    notifyListeners();

    console.log(
      `[Render Keep-Alive] 🟢 Backend pinged successfully in ${elapsed}ms (Call #${keepAliveState.pingCount} - Render server active)`
    );
    return res.data;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    keepAliveState.status = 'offline';
    keepAliveState.latencyMs = elapsed;
    notifyListeners();
    console.warn(`[Render Keep-Alive] ⚠️ Ping warning: ${err.message}`);
    return null;
  }
}

export function initRenderKeepAlive() {
  if (keepAliveTimer) return;

  // 1. Immediate ping on website load to wake up or verify Render backend
  pingBackend();

  // 2. Set interval to ping every 14 minutes
  keepAliveTimer = setInterval(() => {
    pingBackend();
  }, KEEP_ALIVE_INTERVAL_MS);

  // 3. Tab visibility check: if user returns to tab after 14+ minutes, ping immediately
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastPing = Date.now() - lastPingTimestamp;
        if (timeSinceLastPing > KEEP_ALIVE_INTERVAL_MS) {
          console.log('[Render Keep-Alive] 🔄 Tab active after idle period, waking up backend...');
          pingBackend();
        }
      }
    });
  }

  console.log('[Render Keep-Alive] ⚡ 14-minute interval established to keep Render active.');
}
