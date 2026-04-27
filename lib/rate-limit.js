import { db } from "@/lib/prisma";

/**
 * Postgres-backed rate limiter. Cheap and good enough for our scale.
 *
 * @param {string} userId
 * @param {string} action  - e.g. "ai.resume.improve", "ai.cover-letter"
 * @param {number} max     - max calls allowed within the window
 * @param {number} windowMs - window size in ms (default 60s)
 * @throws Error("Rate limit exceeded ...") when over the limit
 */
export async function checkRateLimit(userId, action, max, windowMs = 60_000) {
  const since = new Date(Date.now() - windowMs);

  const count = await db.rateLimit.count({
    where: { userId, action, createdAt: { gte: since } },
  });

  if (count >= max) {
    const seconds = Math.ceil(windowMs / 1000);
    throw new Error(
      `Rate limit exceeded for ${action}. Max ${max} requests per ${seconds}s.`
    );
  }

  await db.rateLimit.create({ data: { userId, action } });

  // Opportunistic cleanup: 1% chance to prune entries older than 1 hour
  if (Math.random() < 0.01) {
    db.rateLimit
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 3600_000) } } })
      .catch(() => {});
  }
}
