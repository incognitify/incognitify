# syntax=docker/dockerfile:1
# Builds and runs the Incognitify Cloud SvelteKit app (adapter-node) from the pnpm
# monorepo. Build context is the REPO ROOT (so packages/core is available).

FROM node:22-slim AS build
RUN npm install -g pnpm@10.20.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
# core is a workspace dependency of the cloud app — build it first.
RUN pnpm --filter @incognitify/core build
RUN pnpm --filter @incognitify/cloud build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo/apps/cloud
COPY --from=build /repo /repo
EXPOSE 3000
# Start command (migrate then serve) is set in railway.json.
CMD ["node", "build"]
