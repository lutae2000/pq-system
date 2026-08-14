FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG NEXT_API_BASE_URL
ARG NEXT_API_KEY
ARG NEXT_SERVICE_ID
ENV NEXT_API_BASE_URL=${NEXT_API_BASE_URL}
ENV NEXT_API_KEY=${NEXT_API_KEY}
ENV NEXT_SERVICE_ID=${NEXT_SERVICE_ID}
COPY --from=deps /app/node_modules ./node_modules
COPY . . 
RUN npm run build

FROM base AS runner
ARG NEXT_API_BASE_URL
ARG NEXT_API_KEY
ARG NEXT_SERVICE_ID
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_API_BASE_URL=${NEXT_API_BASE_URL}
ENV NEXT_API_KEY=${NEXT_API_KEY}
ENV NEXT_SERVICE_ID=${NEXT_SERVICE_ID}
WORKDIR /app

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "server.js"]
