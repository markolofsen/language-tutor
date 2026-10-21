# Self-hosting image: Next.js standalone + a libSQL database file on a volume.
FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS installer
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# next.config.ts switches to `output: "standalone"` on this; Vercel does not set it.
ENV BUILD_STANDALONE=1
RUN pnpm build
# Git does not track an empty directory; the runner COPY would fail naming a path.
RUN mkdir -p public

FROM node:22-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# The database lives on the volume, never in the image layer.
ENV DATABASE_URL=file:/data/english.db

# sqlite3 is only for online backups (`sqlite3 /data/english.db ".backup file"`), not for the app.
RUN apt-get update \
 && apt-get install -y --no-install-recommends sqlite3 \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir /data && chown nextjs:nodejs /data

WORKDIR /app
COPY --from=installer --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/public ./public
# A local file database is migrated at first use, from ./drizzle.
COPY --from=installer --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
VOLUME /data
EXPOSE 3000
CMD ["node", "server.js"]
