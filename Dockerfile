FROM node:20-alpine AS build
USER root

RUN apk add --no-cache bash git python3 build-base

WORKDIR /recruitment-bot
COPY . .
RUN chmod 755 docker/integration-entrypoint.sh docker/wait-for-it.sh

RUN npm ci
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
EXPOSE 80/tcp

RUN apk add --no-cache bash

WORKDIR /recruitment-bot
COPY --from=build /recruitment-bot/node_modules node_modules
COPY --from=build /recruitment-bot/out out
COPY --from=build /recruitment-bot/migrations migrations
COPY --from=build /recruitment-bot/package.json .
COPY --from=build /recruitment-bot/package-lock.json .
COPY --from=build /recruitment-bot/knexfile.ts .
COPY --from=build /recruitment-bot/migration-helpers.ts .

RUN addgroup -S recruitment-bot && adduser -S recruitment-bot -G recruitment-bot
RUN chown -R recruitment-bot:recruitment-bot .
USER recruitment-bot:recruitment-bot

ENTRYPOINT bash -c "npm run migrate --production && npm start --production"
