FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends git python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
