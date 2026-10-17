/**
 * Render Keep-Alive Worker
 *
 * Render free web services spin down after 15 minutes of inactivity.
 * This worker pings the /api/v1/health endpoint every 14 minutes (840,000 ms)
 * to keep the service warm, responsive, and prevent cold-start delays.
 */

const getKeepAliveUrl = () => {
  // 1. Explicit keep-alive override URL
  if (process.env.KEEP_ALIVE_URL) {
    return process.env.KEEP_ALIVE_URL.trim().replace(/\/+$/, '');
  }

  // 2. Render automatically injects RENDER_EXTERNAL_URL for web services
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.trim().replace(/\/+$/, '');
  }

  // 3. Optional BACKEND_URL in .env
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.trim().replace(/\/+$/, '');
  }

  // 4. Default live Render production backend
  return 'https://customer-reminder-h18e.onrender.com';
};

export function startKeepAliveWorker() {
  const targetBaseUrl = getKeepAliveUrl();
  const pingUrl = `${targetBaseUrl}/api/v1/health`;
  const intervalMinutes = parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES || '14', 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[KeepAlive] ⚡ Initializing 14-min keep-alive worker for Render`);
  console.log(`[KeepAlive] 🎯 Target URL: ${pingUrl}`);
  console.log(`[KeepAlive] ⏱️ Interval: Every ${intervalMinutes} minutes (${intervalMs}ms)`);

  const pingServer = async () => {
    try {
      const startTime = Date.now();
      const res = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'RemindIQ-Render-KeepAlive/1.0',
          'Accept': 'application/json',
        },
      });

      const elapsed = Date.now() - startTime;
      if (res.ok) {
        console.log(`[KeepAlive] ✅ Ping success (${res.status} OK) in ${elapsed}ms -> Render server kept active`);
      } else {
        console.warn(`[KeepAlive] ⚠️ Ping returned status ${res.status} in ${elapsed}ms`);
      }
    } catch (err) {
      console.warn(`[KeepAlive] ⚠️ Ping request warning: ${err.message}`);
    }
  };

  // Initial ping 30 seconds after server startup
  const initialTimer = setTimeout(() => {
    pingServer();
  }, 30000);

  // Recurring ping every 14 minutes
  const intervalTimer = setInterval(() => {
    pingServer();
  }, intervalMs);

  return () => {
    clearTimeout(initialTimer);
    clearInterval(intervalTimer);
  };
}
