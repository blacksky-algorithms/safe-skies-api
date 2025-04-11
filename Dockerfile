# Node LTS
ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
EXPOSE 4000

FROM base AS dev
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

USER node
COPY . .
RUN npm run dev

FROM base AS prodbuilder
ENV HUSKY=0
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

USER node
COPY . .
RUN npm run build

FROM prodbuilder AS prodrunner
USER node
COPY --from=prodBuilder /usr/src/app/dist ./dist
RUN node dist/src/server.js
