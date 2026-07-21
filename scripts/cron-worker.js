/**
 * Worker opcional que chama as rotas de cron do app Next.js.
 * Secrets: APP_URL, CRON_SECRET
 */
export default {
  async scheduled(event, env) {
    const base = env.APP_URL?.replace(/\/$/, "");
    const secret = env.CRON_SECRET;
    if (!base || !secret) {
      console.error("APP_URL ou CRON_SECRET ausente");
      return;
    }

    const headers = { Authorization: `Bearer ${secret}` };
    const minute = new Date(event.scheduledTime).getUTCMinutes();
    const hour = new Date(event.scheduledTime).getUTCHours();

    // A cada 15 min → abandono
    if (minute % 15 === 0) {
      await fetch(`${base}/api/cron/abandonment`, { headers });
    }

    // ~02:59 UTC ≈ 23:59 America/Sao_Paulo → Excel + obrigações
    if (hour === 2 && minute === 59) {
      await Promise.all([
        fetch(`${base}/api/cron/daily-excel`, { headers }),
        fetch(`${base}/api/cron/obligations`, { headers }),
      ]);
    }
  },
};
