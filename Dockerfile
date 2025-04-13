# Node LTS
ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
EXPOSE 4000

ARG PORT
ARG NODE_ENV
ARG PGUSER
ARG PGPASSWORD
ARG PGHOST
ARG PGDATABASE
ARG PGPORT
ARG ENCRYPTION_KEY
ARG BSKY_BASE_API_URL
ARG CLIENT_URL
ARG BASE_URL
ARG JWT_SECRET
ARG RSKY_FEEDGEN
ARG RSKY_API_KEY

FROM base AS dev
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/home/node/.npm \
    npm ci --include=dev

USER node
COPY . .
CMD npm run dev

FROM base AS prodbuilder
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/home/node/.npm \
    npm ci --only-production

RUN chown -R node:node /usr/src/app

USER node
COPY --chown=node:node . .
RUN npm run build

FROM base AS prodrunner
USER node
COPY --from=prodbuilder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=prodbuilder --chown=node:node /usr/src/app/dist ./dist
CMD node dist/src/server.js
