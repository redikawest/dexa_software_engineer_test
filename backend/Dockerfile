ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SERVICE
RUN test -n "$SERVICE" || (echo "Missing build argument: --build-arg SERVICE=<service name>" && false)
RUN npx nest build "$SERVICE"

FROM node:${NODE_VERSION}-slim AS migrate
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "migration:run"]

FROM node:${NODE_VERSION}-slim AS runtime
ARG SERVICE
ENV NODE_ENV=production
ENV SERVICE=${SERVICE}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY --from=build /app/dist/apps/${SERVICE} ./dist/apps/${SERVICE}
USER node
CMD ["sh", "-c", "node dist/apps/$SERVICE/main.js"]
