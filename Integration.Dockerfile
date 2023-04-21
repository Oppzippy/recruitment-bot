FROM node:18-alpine
EXPOSE 80/tcp
USER root

RUN apk add --no-cache bash git python3 build-base
RUN addgroup -S recruitment-bot && adduser -S recruitment-bot -G recruitment-bot

USER recruitment-bot:recruitment-bot
WORKDIR /opt/recruitment-bot
RUN chown recruitment-bot:recruitment-bot /opt/recruitment-bot

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY --chown=recruitment-bot:recruitment-bot . .
RUN chmod 755 docker/integration-entrypoint.sh docker/wait-for-it.sh

USER recruitment-bot:recruitment-bot
RUN npm run build
ENTRYPOINT /opt/recruitment-bot/docker/integration-entrypoint.sh
