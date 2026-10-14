# Build the Astro server and its production dependencies.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Run the built standalone server.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
USER node
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4321/api/health || exit 1
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]